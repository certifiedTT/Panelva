import React from "react";
import { Check } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";

export interface CreatorCardProps {
  id?: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  followersCount?: number | string;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  onClick?: () => void;
  onPress?: () => void;
  className?: string;
}

export function CreatorCard({
  name,
  handle,
  avatarUrl,
  isVerified = false,
  followersCount,
  isFollowing = false,
  onFollowToggle,
  onClick,
  onPress,
  className = "",
}: CreatorCardProps) {
  const formattedFollowers =
    typeof followersCount === "number"
      ? followersCount >= 1000
        ? `${(followersCount / 1000).toFixed(1)}k`
        : `${followersCount}`
      : followersCount;

  return (
    <Card className={`flex items-center justify-between p-4 ${className}`}>
      <div
        className={`flex items-center space-x-3 cursor-pointer overflow-hidden ${onClick || onPress ? "cursor-pointer" : ""}`}
        onClick={onClick || onPress}
      >
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-12 w-12 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sm font-bold text-slate-100">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 border border-slate-900 text-white">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">{name}</p>
          {handle && <p className="truncate text-xs text-slate-400">@{handle}</p>}
          {formattedFollowers !== undefined && (
            <p className="mt-0.5 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{formattedFollowers}</span> followers
            </p>
          )}
        </div>
      </div>
      {onFollowToggle && (
        <Button
          variant={isFollowing ? "outline" : "primary"}
          size="sm"
          onClick={onFollowToggle}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </Card>
  );
}
