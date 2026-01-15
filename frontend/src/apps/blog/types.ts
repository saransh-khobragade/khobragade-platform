export interface Post {
  id: string
  title: string
  content: string
  imageUrl: string | null
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
  likes?: Like[]
  comments?: Comment[]
}

export interface Comment {
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

export interface Like {
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

export interface CreatePostInput {
  title: string
  content: string
  imageUrl?: string
}

export interface UpdatePostInput {
  title?: string
  content?: string
  imageUrl?: string
}

export interface CreateCommentInput {
  content: string
}
