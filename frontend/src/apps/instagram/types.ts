export interface InstagramPost {
  id: string
  imageUrl: string
  caption: string | null
  authorId: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  _count?: {
    comments: number
    likes: number
  }
  likes?: InstagramLike[]
  comments?: InstagramComment[]
}

export interface InstagramComment {
  id: string
  content: string
  postId: string
  authorId: string
  createdAt: string
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

export interface InstagramLike {
  id: string
  postId: string
  userId: string
  createdAt: string
  user: {
    id: string
    username: string
    name: string | null
  }
}

export interface CreateInstagramPostInput {
  imageUrl: string
  caption?: string
}

export interface UpdateInstagramPostInput {
  caption?: string
}

export interface CreateInstagramCommentInput {
  content: string
}
