import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { spacing } from '@panelva/theme';
import { CommentCard, CommentData } from './CommentCard';

export interface ReplyThreadProps {
  parentCommentId: string;
  replies: CommentData[];
  currentUserId?: string;
  likedCommentIds?: Record<string, boolean>;
  onToggleLike?: (commentId: string) => void;
  onReply?: (comment: CommentData) => void;
  onDelete?: (commentId: string) => void;
}

export function ReplyThread({
  replies,
  currentUserId,
  likedCommentIds = {},
  onToggleLike,
  onReply,
  onDelete,
}: ReplyThreadProps) {
  const [expanded, setExpanded] = useState(false);

  if (!replies || replies.length === 0) return null;

  return (
    <View style={styles.threadContainer}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.lineIndicator} />
        {expanded ? (
          <ChevronUp size={12} color="#60A5FA" />
        ) : (
          <ChevronDown size={12} color="#60A5FA" />
        )}
        <Text style={styles.toggleText}>
          {expanded
            ? 'Hide replies'
            : `View ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.repliesList}>
          {replies.map((reply) => (
            <View key={reply.id} style={styles.nestedReply}>
              <CommentCard
                comment={reply}
                currentUserId={currentUserId}
                isLiked={!!likedCommentIds[reply.id]}
                onToggleLike={onToggleLike}
                onReply={onReply}
                onDelete={onDelete}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  threadContainer: {
    marginLeft: spacing.lg,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  lineIndicator: {
    width: 16,
    height: 1,
    backgroundColor: '#374151',
  },
  toggleText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '600',
  },
  repliesList: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  nestedReply: {
    marginLeft: spacing.xs,
  },
});
