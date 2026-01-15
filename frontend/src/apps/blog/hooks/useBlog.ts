import { useState, useEffect, useCallback } from "react"
import { blogApi } from "../api"
import { useAuth } from "@/shared/auth/AuthContext"
import type { Post, Comment, CreatePostInput, UpdatePostInput, CreateCommentInput } from "../types"

export const useBlog = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await blogApi.getAllPosts()
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

  // Create a new post
  const createPost = useCallback(
    async (input: CreatePostInput) => {
      try {
        const newPost = await blogApi.createPost(input)
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
  const updatePost = useCallback(async (postId: string, input: UpdatePostInput) => {
    try {
      const updatedPost = await blogApi.updatePost(postId, input)
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
      await blogApi.deletePost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post")
      throw err
    }
  }, [])

  // Add a comment
  const addComment = useCallback(async (postId: string, input: CreateCommentInput) => {
    try {
      const comment = await blogApi.addComment(postId, input)
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), comment],
              _count: {
                ...post._count,
                comments: (post._count?.comments || 0) + 1,
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
      await blogApi.deleteComment(commentId)
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: (post.comments || []).filter((c) => c.id !== commentId),
              _count: {
                ...post._count,
                comments: (post._count?.comments || 1) - 1,
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
      const result = await blogApi.toggleLike(postId)
      
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
                  ...post._count,
                  likes: (post._count?.likes || 0) + 1,
                },
              }
            } else if (!result.liked && hasLiked) {
              // Remove like
              return {
                ...post,
                likes: currentLikes.filter((l) => l.userId !== user?.id),
                _count: {
                  ...post._count,
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
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    toggleLike,
  }
}
