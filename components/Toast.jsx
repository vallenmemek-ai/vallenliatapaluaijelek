export default function Toast({ msg }) {
  return <div className={`toast ${msg ? 'on' : ''}`}>{msg}</div>;
}
