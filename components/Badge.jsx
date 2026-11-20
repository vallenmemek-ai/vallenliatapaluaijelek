export default function Badge({ status }) {
  return <span className={`badge ${status}`}><span className="dot" />{status}</span>;
}
