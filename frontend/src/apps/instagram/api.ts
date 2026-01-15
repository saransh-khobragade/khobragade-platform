import { apiRequest, API_BASE_URL, getAuthToken } from "@/lib/api/client"
import type {
  InstagramPost,
  InstagramComment,
  CreateInstagramPostInput,
  UpdateInstagramPostInput,
  CreateInstagramCommentInput,
} from "./types"

export const instagramApi = {
  /**
   * Get all Instagram posts
   */
  getAllPosts: async (): Promise<InstagramPost[]> => {
    return apiRequest<InstagramPost[]>("/api/instagram/posts")
  },

  /**
   * Get posts by user ID
   */
  getPostsByUserId: async (userId: string): Promise<InstagramPost[]> => {
    return apiRequest<InstagramPost[]>(`/api/instagram/users/${userId}/posts`)
  },

  /**
   * Get post by ID
   */
  getPostById: async (postId: string): Promise<InstagramPost> => {
    return apiRequest<InstagramPost>(`/api/instagram/posts/${postId}`)
  },

  /**
   * Create a new Instagram post
   */
  createPost: async (input: CreateInstagramPostInput): Promise<InstagramPost> => {
    return apiRequest<InstagramPost>("/api/instagram/posts", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  /**
   * Update an Instagram post
   */
  updatePost: async (postId: string, input: UpdateInstagramPostInput): Promise<InstagramPost> => {
    return apiRequest<InstagramPost>(`/api/instagram/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  },

  /**
   * Delete an Instagram post
   */
  deletePost: async (postId: string): Promise<void> => {
    return apiRequest<void>(`/api/instagram/posts/${postId}`, {
      method: "DELETE",
    })
  },

  /**
   * Add a comment to a post
   */
  addComment: async (postId: string, input: CreateInstagramCommentInput): Promise<InstagramComment> => {
    return apiRequest<InstagramComment>(`/api/instagram/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  /**
   * Delete a comment
   */
  deleteComment: async (commentId: string): Promise<void> => {
    return apiRequest<void>(`/api/instagram/comments/${commentId}`, {
      method: "DELETE",
    })
  },

  /**
   * Toggle like on a post
   */
  toggleLike: async (postId: string): Promise<{ liked: boolean }> => {
    return apiRequest<{ liked: boolean }>(`/api/instagram/posts/${postId}/like`, {
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
