import { expect, it, vi } from 'vitest'
import { createHttpClient } from '../../api/httpClient'
import { createAuthApi } from './authApi'
const profile = { id: '9223372036854775807', email: 'u@example.com', nickname: 'User' }
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
it('uploads raw multipart with CSRF and returns a versioned private photo URL', async () => {
  const updated = {...profile, avatarUrl:'/api/v1/me/avatar?v='+'a'.repeat(32)}
  const fetcher = vi.fn().mockResolvedValueOnce(json({token:'csrf',headerName:'X-CSRF-TOKEN'}))
    .mockResolvedValueOnce(json(updated)).mockResolvedValueOnce(json({token:'csrf-new',headerName:'X-CSRF-TOKEN'})).mockResolvedValueOnce(json({...profile,avatarUrl:null}))
  const api = createAuthApi(createHttpClient({fetcher}))
  const file = new File(['image'], 'photo.png', {type:'image/png'})
  expect(await api.uploadAvatar(file)).toEqual(updated)
  const init = fetcher.mock.calls[1][1]
  expect(init.body).toBeInstanceOf(FormData)
  expect(init.body.get('file')).toBe(file)
  expect(new Headers(init.headers).has('Content-Type')).toBe(false)
  expect(new Headers(init.headers).get('X-CSRF-TOKEN')).toBe('csrf')
  expect(await api.deleteAvatar()).toEqual({...profile,avatarUrl:null})
  expect(fetcher.mock.calls[3][1].method).toBe('DELETE')
})
it.each(['https://outside.example/photo','javascript:alert(1)','/api/v1/me/avatar?v=bad'])('rejects an unsafe photo URL %s', async avatarUrl => {
  const api = createAuthApi(createHttpClient({fetcher:vi.fn().mockResolvedValue(json({...profile,avatarUrl}))}))
  await expect(api.me()).rejects.toMatchObject({code:'PROTOCOL'})
})
it('sends verification requests with CSRF and rejects malformed proof responses', async () => {
  const sent = { challengeId: '12345678-1234-1234-1234-123456789abc', expiresAt: '2026-11-20T00:10:00Z', resendAfterSeconds: 60 }
  const fetcher = vi.fn().mockResolvedValueOnce(json({ token: 'one', headerName: 'X-CSRF-TOKEN' }))
    .mockResolvedValueOnce(json(sent)).mockResolvedValueOnce(json({ verificationToken: 'short', expiresAt: sent.expiresAt }))
  const api = createAuthApi(createHttpClient({ fetcher }))
  expect(await api.requestEmailVerification('u@example.com')).toEqual(sent)
  await expect(api.confirmEmailVerification({ email: 'u@example.com', challengeId: sent.challengeId, code: '001234' })).rejects.toMatchObject({ code: 'PROTOCOL' })
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ email: 'u@example.com' })
  expect(new Headers(fetcher.mock.calls[2][1].headers).get('X-CSRF-TOKEN')).toBe('one')
})
it('preserves string IDs, returns only profile fields and rotates CSRF after login', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(json({ token: 'one', headerName: 'X-CSRF-TOKEN' }))
    .mockResolvedValueOnce(json({ ...profile, passwordHash: 'never expose' }))
    .mockResolvedValueOnce(json({ token: 'two', headerName: 'X-CSRF-TOKEN' }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  const auth = createAuthApi(createHttpClient({ fetcher }))
  expect(await auth.login({ email: profile.email, password: ' password with spaces ' })).toEqual(profile)
  await auth.logout()
  expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/csrf'))).toHaveLength(2)
  expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).get('X-CSRF-TOKEN')).toBe('two')
})
it('rejects incompatible profile responses instead of falling back to mock login', async () => {
  const auth = createAuthApi(createHttpClient({ fetcher: vi.fn().mockResolvedValue(json({ ...profile, id: 1 })) }))
  await expect(auth.me()).rejects.toMatchObject({ code: 'PROTOCOL' })
})

it('sends account methods and bodies with CSRF, never trimming passwords',async()=>{
 const fetcher=vi.fn().mockImplementation((url:string,options:RequestInit)=>Promise.resolve(url.endsWith('/csrf')?new Response(JSON.stringify({token:'token',headerName:'X-CSRF-TOKEN'})):options.method==='PATCH'?new Response(JSON.stringify({...profile,nickname:'New'})):new Response(null,{status:204})))
 const a=createAuthApi(createHttpClient({fetcher}));expect(await a.updateProfile({nickname:'New'})).toMatchObject({nickname:'New'});await a.changePassword({currentPassword:' current ',newPassword:' a unique new password! '});await a.deleteAccount({currentPassword:' current '})
 expect(fetcher.mock.calls.filter(([url])=>!url.endsWith('/csrf')).map(([url,options])=>[url,options.method,JSON.parse(options.body)])).toEqual([['/api/v1/me','PATCH',{nickname:'New'}],['/api/v1/me/password','PUT',{currentPassword:' current ',newPassword:' a unique new password! '}],['/api/v1/me/deletion','POST',{currentPassword:' current '}]])
})

it('shares explicit restores, sends no body and refreshes CSRF afterward', async () => {
 const fetcher=vi.fn().mockResolvedValueOnce(json({token:'before',headerName:'X-CSRF-TOKEN'}))
  .mockResolvedValueOnce(json(profile)).mockResolvedValueOnce(json({token:'after',headerName:'X-CSRF-TOKEN'}));
 const api=createAuthApi(createHttpClient({fetcher}));
 await Promise.all([api.restoreSession(),api.restoreSession()]);
 expect(fetcher.mock.calls.map(([url])=>url)).toEqual(['/api/v1/auth/csrf','/api/v1/auth/session','/api/v1/auth/csrf']);
 expect(fetcher.mock.calls[1][1].body).toBeUndefined();
 expect(new Headers(fetcher.mock.calls[1][1].headers).get('X-CSRF-TOKEN')).toBe('before');
});
it('keeps restore failures local instead of publishing unauthorized events',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(json({token:'csrf',headerName:'X-CSRF-TOKEN'}))
  .mockResolvedValueOnce(new Response(JSON.stringify({code:'UNAUTHENTICATED'}),{status:401}));
 const client=createHttpClient({fetcher});const listener=vi.fn();client.onUnauthorized(listener);
 await expect(createAuthApi(client).restoreSession()).rejects.toMatchObject({status:401});expect(listener).not.toHaveBeenCalled();
});

it('serializes logout after a pending restore and propagates logout failures',async()=>{
 let finish!: (value:Response)=>void;
 const fetcher=vi.fn().mockImplementation((url:string)=>{
  if(url.endsWith('/csrf'))return Promise.resolve(json({token:'csrf',headerName:'X-CSRF-TOKEN'}));
  if(url.endsWith('/session'))return new Promise<Response>(resolve=>{finish=resolve});
  return Promise.resolve(new Response(JSON.stringify({code:'UNAUTHENTICATED'}),{status:401}));
 });
 const api=createAuthApi(createHttpClient({fetcher}));const restoring=api.restoreSession();
 await vi.waitFor(()=>expect(finish).toBeDefined());const logout=api.logout();
 expect(fetcher.mock.calls.some(([url])=>url.endsWith('/logout'))).toBe(false);
 finish(json(profile));await restoring;await expect(logout).rejects.toMatchObject({status:401});
 expect(fetcher.mock.calls.at(-1)![0]).toBe('/api/v1/auth/logout');
});

it('discards anonymous CSRF after conflict so the next write uses the current session token',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(json({token:'anonymous',headerName:'X-CSRF-TOKEN'}))
  .mockResolvedValueOnce(new Response(JSON.stringify({code:'CONFLICT'}),{status:409}))
  .mockResolvedValueOnce(json(profile)).mockResolvedValueOnce(json({token:'current',headerName:'X-CSRF-TOKEN'}))
  .mockResolvedValueOnce(json(profile));
 const api=createAuthApi(createHttpClient({fetcher}));await expect(api.restoreSession()).rejects.toMatchObject({status:409});
 await api.me();await api.updateProfile({nickname:'New'});
 expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).get('X-CSRF-TOKEN')).toBe('current');
});

it.each(['nickname','upload','delete'] as const)('waits for pending restoration before profile %s',async operation=>{
 let finish!: (response:Response)=>void;
 let csrfCount=0;
 const fetcher=vi.fn().mockImplementation((url:string)=>{
  if(url.endsWith('/csrf'))return Promise.resolve(json({token:`csrf-${++csrfCount}`,headerName:'X-CSRF-TOKEN'}));
  if(url.endsWith('/session'))return new Promise<Response>(resolve=>{finish=resolve});
  return Promise.resolve(json({...profile,nickname:'Updated',avatarUrl:null}));
 });
 const api=createAuthApi(createHttpClient({fetcher}));const restoring=api.restoreSession();
 await vi.waitFor(()=>expect(finish).toBeDefined());
 const file=new File(['image'],'photo.png',{type:'image/png'});
 const writing=operation==='nickname'?api.updateProfile({nickname:'Updated'}):operation==='upload'?api.uploadAvatar(file):api.deleteAvatar();
 // Flush the request chain: the write must remain blocked while restore is pending.
 await new Promise(resolve=>setTimeout(resolve,0));
 expect(fetcher.mock.calls.filter(([url])=>url==='/api/v1/me'||url.endsWith('/me/avatar'))).toHaveLength(0);
 finish(json(profile));await restoring;
 await expect(writing).resolves.toEqual({...profile,nickname:'Updated',avatarUrl:null});
 const [url,options]=fetcher.mock.calls.at(-1)!;
 expect(url).toBe(operation==='nickname'?'/api/v1/me':'/api/v1/me/avatar');
 expect(options.method).toBe(operation==='nickname'?'PATCH':operation==='upload'?'PUT':'DELETE');
 expect(new Headers(options.headers).get('X-CSRF-TOKEN')).toBe('csrf-3');
 if(operation==='nickname')expect(JSON.parse(options.body)).toEqual({nickname:'Updated'});
 if(operation==='upload')expect((options.body as FormData).get('file')).toBe(file);
});
