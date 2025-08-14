
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getPosts, type Post } from '@/services/firestore-listeners';
import type { Comment } from '@/services/firestore';
import { addPost, handleVote, addComment } from './actions';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowBigDown,
  ArrowBigUp,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';


export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('');
  
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const { toast } = useToast();
  
  // State for comment handling
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const { user, profile, loading: authLoading } = useAuth();


  const invalidateSustainabilityData = useCallback(() => {
    try {
      localStorage.removeItem('sustainabilityScore');
      localStorage.removeItem('sustainabilityImprovements');
      localStorage.removeItem('sdgData');
    } catch (error) {
      console.error("Failed to invalidate sustainability data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    setIsLoading(true);
    const unsubscribePosts = getPosts(user?.email || null, (newPosts) => {
      const sortedPosts = newPosts.sort((a, b) => b.upvotes - a.upvotes);
      setPosts(sortedPosts);
      setIsLoading(false);
    });

    return () => {
      unsubscribePosts();
    };
  }, [user, authLoading]);
  
  const updateLocalPost = (postId: string, updates: Partial<Post>) => {
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(p => (p.id === postId ? { ...p, ...updates } : p));
      return updatedPosts.sort((a, b) => b.upvotes - a.upvotes);
    });
  };

  const handleVoteClick = async (postId: string, voteType: 'up' | 'down') => {
    if (!user?.email) {
      toast({ title: 'Not Signed In', description: 'You must be signed in to vote.', variant: 'destructive'});
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const originalVoteStatus = post.voteStatus;
    const originalUpvotes = post.upvotes;

    let newVoteStatus: Post['voteStatus'] = post.voteStatus;
    let voteIncrement = 0;

    if (voteType === 'up') {
      if (originalVoteStatus === 'up') {
        newVoteStatus = null;
        voteIncrement = -1;
      } else if (originalVoteStatus === 'down') {
        newVoteStatus = 'up';
        voteIncrement = 2;
      } else {
        newVoteStatus = 'up';
        voteIncrement = 1;
      }
    } else if (voteType === 'down') {
      if (originalVoteStatus === 'down') {
        newVoteStatus = null;
        voteIncrement = 1;
      } else if (originalVoteStatus === 'up') {
        newVoteStatus = 'down';
        voteIncrement = -2;
      } else {
        newVoteStatus = 'down';
        voteIncrement = -1;
      }
    }

    updateLocalPost(postId, {
      voteStatus: newVoteStatus,
      upvotes: post.upvotes + voteIncrement,
    });

    try {
      await handleVote(postId, user.email, voteIncrement, newVoteStatus);
    } catch (error) {
      console.error('Failed to vote:', error);
      toast({
        title: 'Error',
        description: 'Could not register your vote.',
        variant: 'destructive',
      });
      updateLocalPost(postId, {
        voteStatus: originalVoteStatus,
        upvotes: originalUpvotes,
      });
    }
  };


  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    if (!user || !profile) {
      toast({ title: "Authentication Error", description: "Could not identify user. Please sign in again.", variant: "destructive"});
      return;
    }
    
    setIsSubmittingComment(true);

    const tempComment: Comment = {
      author: profile.businessName,
      text: newComment,
      createdAt: new Date().toISOString(),
    };
    
    const updatedComments = [...(selectedPost.comments), tempComment];
    updateLocalPost(selectedPost.id, { comments: updatedComments });
    setSelectedPost(prev => prev ? {...prev, comments: updatedComments} : null);
    setNewComment('');

    try {
      await addComment(selectedPost.id, tempComment.text, tempComment.author);
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({ title: "Error", description: "Could not add your comment.", variant: "destructive"});
      const revertedComments = selectedPost.comments;
      updateLocalPost(selectedPost.id, { comments: revertedComments });
       setSelectedPost(prev => prev ? {...prev, comments: revertedComments} : null);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
 const handleAddPost = async () => {
    if (!newPostTitle || !newPostCategory) {
       toast({ title: "Incomplete Form", description: "Please provide a title and category.", variant: "destructive"});
       return;
    }
    if (!user || !profile) {
      toast({ title: "Authentication Error", description: "Could not identify user. Please sign in again.", variant: "destructive"});
      return;
    }
    
    setIsSubmittingPost(true);
    
    const tempId = `temp-${Date.now()}`;
    const newPost: Post = {
      id: tempId,
      title: newPostTitle,
      category: newPostCategory,
      businessName: profile.businessName,
      author: user.email!,
      upvotes: 0,
      comments: [],
      voters: {},
      createdAt: new Date().toISOString(),
      time: 'Just now',
      voteStatus: null,
    };

    setPosts(prevPosts => [newPost, ...prevPosts].sort((a,b) => b.upvotes - a.upvotes));
    
    setNewPostTitle('');
    setNewPostCategory('');
    setIsPostDialogOpen(false);
    
    try {
        await addPost(newPost.title, newPost.category, newPost.businessName, user.email!);
        invalidateSustainabilityData();
        toast({ title: "Conversation Started!", description: "Your post is now live on the forum."});
    } catch (error) {
        console.error("Failed to add post:", error);
        toast({ title: "Error", description: "Could not add your post. Please try again.", variant: "destructive"});
        setPosts(prevPosts => prevPosts.filter(p => p.id !== tempId));
    } finally {
        setIsSubmittingPost(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString || dateString === 'Just now') return 'Just now';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Just now';
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        return dateString;
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare /> Sustainability Forum
          </h1>
          <p className="text-muted-foreground">
            Connect, discuss, and learn with a community of sustainable businesses.
          </p>
        </div>
         <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Start a Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a New Conversation</DialogTitle>
              <DialogDescription>
                Share your thoughts, ask questions, or start a discussion with the community.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  name="title"
                  placeholder="e.g., How to reduce packaging waste?"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  disabled={isSubmittingPost}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="post-category">Category</Label>
                <Input
                  id="post-category"
                  name="category"
                  placeholder="e.g., Discussion"
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  disabled={isSubmittingPost}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" type="button" disabled={isSubmittingPost}>Cancel</Button>
              </DialogClose>
              <Button type="button" onClick={handleAddPost} disabled={isSubmittingPost || authLoading}>
                {isSubmittingPost && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-4">
        {isLoading || authLoading ? (
            <div className="text-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/>
                <p className="text-muted-foreground mt-2">Loading conversations...</p>
            </div>
        ) : posts.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-semibold">No conversations yet.</h3>
                <p className="text-muted-foreground mt-1">Be the first to start a discussion!</p>
            </div>
        ) : (
            posts.map((post) => (
            <Card key={post.id} className="flex transition-shadow duration-300 hover:shadow-lg">
                <div className="flex flex-col items-center justify-start gap-1 p-4 bg-muted/50 border-r">
                <Button variant="ghost" size="icon" onClick={() => handleVoteClick(post.id, 'up')}>
                    <ArrowBigUp className={cn("h-5 w-5", post.voteStatus === 'up' ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary")} />
                </Button>
                <span className="text-lg font-bold text-foreground">{post.upvotes}</span>
                <Button variant="ghost" size="icon" onClick={() => handleVoteClick(post.id, 'down')}>
                    <ArrowBigDown className={cn("h-5 w-5", post.voteStatus === 'down' ? "text-destructive fill-destructive" : "text-muted-foreground hover:text-destructive")} />
                </Button>
                </div>
                <div className="flex flex-col flex-grow">
                <CardHeader className="py-3 px-6">
                    <p className="text-xs font-semibold text-primary">{post.category}</p>
                    <CardTitle className="text-lg font-bold tracking-tight">{post.title}</CardTitle>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground pt-1">
                        Posted by <Link href={post.author === user?.email ? '/dashboard' : `/profile/${encodeURIComponent(post.author)}`} className="font-medium text-foreground hover:underline">{post.businessName}</Link> • {formatTimeAgo(post.createdAt)}
                        </p>
                        <Dialog onOpenChange={(isOpen) => { if (!isOpen) setSelectedPost(null); }}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground" onClick={() => setSelectedPost(post)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>{post.comments.length} comments</span>
                            </Button>
                        </DialogTrigger>
                        {selectedPost && selectedPost.id === post.id && (
                            <DialogContent className="sm:max-w-[625px]">
                            <DialogHeader>
                                <DialogTitle>{selectedPost.title}</DialogTitle>
                                <DialogDescription>
                                Posted by {selectedPost.businessName} • {formatTimeAgo(selectedPost.createdAt)}
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[400px] border-t border-b">
                              <div className="p-4 space-y-4">
                                {selectedPost.comments.length > 0 ? (
                                selectedPost.comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((comment, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                                    <p className="font-semibold text-sm">{comment.author}</p>
                                    <p className="text-muted-foreground text-sm">{comment.text}</p>
                                    </div>
                                ))
                                ) : (
                                <p className="text-center text-muted-foreground text-sm py-4">No comments yet.</p>
                                )}
                              </div>
                            </ScrollArea>
                            <DialogFooter className="pt-4">
                                <div className="flex items-center w-full gap-2">
                                <Textarea
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={1}
                                    className="flex-grow resize-none"
                                    disabled={isSubmittingComment}
                                    />
                                    <Button size="icon" onClick={handleAddComment} disabled={isSubmittingComment}>
                                        {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                                        <span className="sr-only">Send Comment</span>
                                    </Button>
                                </div>
                            </DialogFooter>
                            </DialogContent>
                        )}
                        </Dialog>
                    </div>
                </CardHeader>
                </div>
            </Card>
            ))
        )}
      </div>
    </div>
  );
}
