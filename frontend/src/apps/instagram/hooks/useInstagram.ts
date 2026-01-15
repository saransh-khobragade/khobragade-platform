import { useState, useEffect, useCallback } from "react"
import { instagramApi } from "../api"
import { useAuth } from "@/shared/auth/AuthContext"
import type {
  InstagramPost,
  CreateInstagramPostInput,
  UpdateInstagramPostInput,
  CreateInstagramCommentInput,
} from "../types"

export const useInstagram = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all posts (feed)
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await instagramApi.getAllPosts()
      setPosts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Fetch posts by user ID
  const fetchUserPosts = useCallback(async (userId: string): Promise<InstagramPost[]> => {
    try {
      const data = await instagramApi.getPostsByUserId(userId)
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to fetch user posts")
    }
  }, [])

  // Create a new post
  const createPost = useCallback(
    async (input: CreateInstagramPostInput) => {
      try {
        const newPost = await instagramApi.createPost(input)
        setPosts((prev) => [newPost, ...prev])
        return newPost
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create post")
        throw err
      }
    },
    []
  )

  // Update a post
  const updatePost = useCallback(async (postId: string, input: UpdateInstagramPostInput) => {
    try {
      const updatedPost = await instagramApi.updatePost(postId, input)
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)))
      return updatedPost
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post")
      throw err
    }
  }, [])

  // Delete a post
  const deletePost = useCallback(async (postId: string) => {
    try {
      await instagramApi.deletePost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post")
      throw err
    }
  }, [])

  // Add a comment
  const addComment = useCallback(async (postId: string, input: CreateInstagramCommentInput) => {
    try {
      const comment = await instagramApi.addComment(postId, input)
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), comment],
              _count: {
                comments: (post._count?.comments || 0) + 1,
                likes: post._count?.likes || 0,
              },
            }
          }
          return post
        })
      )
      return comment
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment")
      throw err
    }
  }, [])

  // Delete a comment
  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    try {
      await instagramApi.deleteComment(commentId)
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: (post.comments || []).filter((c) => c.id !== commentId),
              _count: {
                comments: Math.max((post._count?.comments || 1) - 1, 0),
                likes: post._count?.likes || 0,
              },
            }
          }
          return post
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment")
      throw err
    }
  }, [])

  // Toggle like
  const toggleLike = useCallback(async (postId: string) => {
    try {
      const result = await instagramApi.toggleLike(postId)

      // Optimistically update the post
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const currentLikes = post.likes || []
            const hasLiked = currentLikes.some((l) => l.userId === user?.id)

            if (result.liked && !hasLiked) {
              // Add like
              return {
                ...post,
                likes: [
                  ...currentLikes,
                  {
                    id: `temp-${Date.now()}`,
                    postId,
                    userId: user!.id,
                    createdAt: new Date().toISOString(),
                    user: {
                      id: user!.id,
                      username: user!.username,
                      name: user!.name,
                    },
                  },
                ],
                _count: {
                  comments: post._count?.comments || 0,
                  likes: (post._count?.likes || 0) + 1,
                },
              }
            } else if (!result.liked && hasLiked) {
              // Remove like
              return {
                ...post,
                likes: currentLikes.filter((l) => l.userId !== user?.id),
                _count: {
                  comments: post._count?.comments || 0,
                  likes: Math.max((post._count?.likes || 1) - 1, 0),
                },
              }
            }
          }
          return post
        })
      )

      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle like")
      throw err
    }
  }, [user])

  return {
    posts,
    loading,
    error,
    fetchPosts,
    fetchUserPosts,
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    toggleLike,
  }
}
