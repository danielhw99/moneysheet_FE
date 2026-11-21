import { useState } from 'react'
export default function ProfileAvatar({url,nickname}:{url?:string|null;nickname:string}) {
 const [failed,setFailed]=useState<string|null>(null)
 return url && failed!==url ? <img className="avatar profile-photo" src={url} alt="프로필 사진" onError={()=>setFailed(url)}/>
  : <div className="avatar" role="img" aria-label="기본 프로필">{Array.from(nickname)[0] || '?'}</div>
}
