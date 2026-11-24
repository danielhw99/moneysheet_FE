export default function LoadingSpinner() {
  return <svg className="loading-spinner" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <circle className="loading-spinner-track" cx="10" cy="10" r="8" />
    <path className="loading-spinner-arc" d="M10 2a8 8 0 0 1 8 8" />
  </svg>
}
