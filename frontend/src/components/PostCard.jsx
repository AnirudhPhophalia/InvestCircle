import { Link } from 'react-router-dom'
import VoteButtons from './VoteButtons.jsx'
import { timeAgo } from '../lib/time.js'

export default function PostCard({ post, onVoteChange }) {
  const tickers = post.tickers ? post.tickers.split(',').filter(Boolean) : []

  return (
    <div className="bg-surface-container-lowest border border-outline-variant flex">
      <VoteButtons post={post} onChange={(result) => onVoteChange(post.id, result)} />
      <div className="p-md flex-1 flex flex-col gap-sm min-w-0">
        <div className="flex items-center gap-xs text-body-sm text-outline flex-wrap">
          <span className="font-bold text-on-surface">u/{post.handle}</span>
          {post.badge && (
            <span className="px-xs py-[2px] bg-secondary/10 text-secondary border border-secondary/20 rounded text-[10px] leading-none uppercase tracking-wider">
              {post.badge}
            </span>
          )}
          <span>•</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        <div className="flex items-start justify-between gap-md">
          <h2 className="text-headline-md">
            <Link to={`/discussions/${post.id}`} className="text-on-surface hover:text-primary transition-colors">
              {post.title}
            </Link>
          </h2>
          {tickers.length > 0 && (
            <div className="flex gap-xs shrink-0">
              {tickers.map((t) => (
                <span key={t} className="text-data-mono px-sm py-xs bg-surface-variant border border-outline-variant text-on-surface">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="text-body-md text-on-surface-variant line-clamp-3">{post.body}</p>
        <div className="flex items-center gap-md mt-sm border-t border-outline-variant pt-sm">
          <span className="flex items-center gap-xs text-outline">
            <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
            <span className="text-label-caps">{post.comment_count} COMMENTS</span>
          </span>
        </div>
      </div>
    </div>
  )
}
