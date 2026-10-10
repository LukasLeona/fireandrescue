import Link from 'next/link';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="Fire and Rescue Academy home">
      <span className="brand-lockup">
        <span className="brand-emblem">
          <img src="/assets/images/academy-emblem-clean-256.png" alt="" width="256" height="256" aria-hidden="true" />
        </span>
        <span className="brand-wordmark"><strong>Fire &amp; Rescue</strong><small>Academy</small></span>
      </span>
    </Link>
  );
}
