import { apiRequest, API_BASE_URL, getAuthToken } from "@/lib/api/client"
import type { Post, Comment, CreatePostInput, UpdatePostInput, CreateCommentInput } from "./types"

export const blogApi = {
  /**
   * Get all posts
   */
  getAllPosts: async (): Promise<Post[]> => {
    return apiRequest<Post[]>("/api/blog/posts")
  },

  /**
   * Get post by ID
   */
  getPostById: async (postId: string): Promise<Post> => {
    return apiRequest<Post>(`/api/blog/posts/${postId}`)
  },

  /**
   * Create a new post
   */
  createPost: async (input: CreatePostInput): Promise<Post> => {
    return apiRequest<Post>("/api/blog/posts", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  /**
   * Update a post
   */
  updatePost: async (postId: string, input: UpdatePostInput): Promise<Post> => {
    return apiRequest<Post>(`/api/blog/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  },

  /**
   * Delete a post
   */
  deletePost: async (postId: string): Promise<void> => {
    return apiRequest<void>(`/api/blog/posts/${postId}`, {
      method: "DELETE",
    })
  },

  /**
   * Add a comment to a post
   */
  addComment: async (postId: string, input: CreateCommentInput): Promise<Comment> => {
    return apiRequest<Comment>(`/api/blog/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  /**
   * Delete a comment
   */
  deleteComment: async (commentId: string): Promise<void> => {
    return apiRequest<void>(`/api/blog/comments/${commentId}`, {
      method: "DELETE",
    })
  },

  /**
   * Toggle like on a post
   */
  toggleLike: async (postId: string): Promise<{ liked: boolean }> => {
    return apiRequest<{ liked: boolean }>(`/api/blog/posts/${postId}/like`, {
      method: "POST",
    })
  },

  /**
   * Upload an image file
   */
  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(error.error || "Upload failed")
    }

    const data = await response.json()
    return {
      url: data.url,
      filename: data.filename,
    }
  },
}
