import React from "react";
import { Star } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";

export interface SeriesCardProps {
  id?: string;
  title: string;
  coverUrl: string;
  type?: "COMIC" | "NOVEL";
  rating?: string | number;
  genre?: string;
  author?: string;
  totalChapters?: number;
  badgeText?: string;
  cardWidth?: number;
  onClick?: () => void;
  onPress?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SeriesCard({
  title,
  coverUrl,
  type = "COMIC",
  rating,
  genre,
  author,
  totalChapters,
  badgeText,
  cardWidth,
  onClick,
  onPress,
  className = "",
  style,
}: SeriesCardProps) {
  const isNovel = type === "NOVEL";

  return (
    <Card
      style={cardWidth ? { width: cardWidth, ...style } : style}
      className={`group cursor-pointer overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-1 ${className}`}
      onClick={onClick || onPress}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant={isNovel ? "secondary" : "primary"} size="sm">
            {type}
          </Badge>
          {badgeText && (
            <Badge variant="outline" size="sm">
              {badgeText}
            </Badge>
          )}
        </div>

        {rating !== undefined && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm border border-white/10">
            <Star className="h-2.5 w-2.5 fill-amber-400 stroke-none" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="truncate text-sm font-bold text-slate-100">{title}</h4>
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          {genre && <span className="font-semibold text-blue-400">{genre}</span>}
          {genre && (author || totalChapters !== undefined) && <span>•</span>}
          {author && <span className="truncate">{author}</span>}
          {!author && totalChapters !== undefined && <span>{totalChapters} ch</span>}
        </div>
      </div>
    </Card>
  );
}
