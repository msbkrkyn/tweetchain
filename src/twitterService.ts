// Updated twitterService.ts - Real Twitter Integration
class TwitterService {
  private isConnected: boolean = false;
  private userHandle: string | null = null;

  // Simulated connection - User enables Twitter sharing
  async connectTwitterAccount(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate connection prompt
      const confirmed = window.confirm(
        '🐦 Twitter Entegrasyonu\n\n' +
        'Bu özellik aktif edildiğinde, tweet\'lerinizin yanında "Twitter\'a Paylaş" butonu görünecek.\n\n' +
        'Her tweet attığınızda Twitter\'a da paylaşmak ister misiniz?'
      );
      
      if (confirmed) {
        this.isConnected = true;
        localStorage.setItem('tweetchain_twitter_enabled', 'true');
        
        // Optional: Ask for Twitter handle for personalization
        const handle = window.prompt('Twitter kullanıcı adınızı girin (isteğe bağlı):');
        if (handle) {
          this.userHandle = handle.replace('@', '');
          localStorage.setItem('tweetchain_twitter_handle', this.userHandle);
        }
        
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  disconnectTwitter(): void {
    this.isConnected = false;
    this.userHandle = null;
    localStorage.removeItem('tweetchain_twitter_enabled');
    localStorage.removeItem('tweetchain_twitter_handle');
  }

  isTwitterConnected(): boolean {
    if (this.isConnected) return true;
    
    // Check localStorage for persistent connection
    const stored = localStorage.getItem('tweetchain_twitter_enabled');
    if (stored === 'true') {
      this.isConnected = true;
      this.userHandle = localStorage.getItem('tweetchain_twitter_handle');
      return true;
    }
    
    return false;
  }

  // Real Twitter sharing via Twitter Intent URL
  async crossPostToTwitter(tweetContent: string, xpEarned: number): Promise<boolean> {
    try {
      // Prepare tweet text
      let tweetText = tweetContent;
      
      // Add TweetChain branding
      tweetText += `\n\n🚀 Posted on #TweetChain - Web3 Social Media`;
      tweetText += `\n💎 Earned ${xpEarned} XP on blockchain!`;
      tweetText += `\n\n#Web3 #Solana #Blockchain`;
      
      // Add user handle if available
      if (this.userHandle) {
        tweetText += `\n\nJoin me @${this.userHandle} on TweetChain!`;
      }
      
      // Add platform URL
      const platformUrl = 'https://tweetchain-delta.vercel.app';
      
      // Create Twitter Intent URL
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(platformUrl)}`;
      
      // Open Twitter in new window
      const twitterWindow = window.open(
        twitterUrl,
        'twitter-share',
        'width=550,height=420,resizable=1,scrollbars=yes'
      );

      // Check if window opened successfully
      if (twitterWindow) {
        // Optional: Show success message after a delay
        setTimeout(() => {
          // Window is opened, assume success
          console.log('Twitter share window opened successfully');
        }, 1000);
        
        return true;
      } else {
        // Fallback: Direct link if popup blocked
        window.open(twitterUrl, '_blank');
        return true;
      }
      
    } catch (error) {
      console.error('Twitter sharing error:', error);
      
      // Fallback: Simple Twitter intent
      const simpleText = `${tweetContent}\n\n🚀 #TweetChain #Web3`;
      const fallbackUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(simpleText)}`;
      window.open(fallbackUrl, '_blank');
      
      return true; // Still consider it success since window opened
    }
  }

  // Quick share function for manual sharing
  shareToTwitter(tweetContent: string): void {
    const tweetText = `${tweetContent}\n\n🚀 Shared from #TweetChain\n💎 Web3 Social Media Platform\n\nhttps://tweetchain-delta.vercel.app`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    window.open(
      twitterUrl,
      'twitter-share',
      'width=550,height=420,resizable=1,scrollbars=yes'
    );
  }

  // Get user's Twitter handle if connected
  getTwitterHandle(): string | null {
    return this.userHandle;
  }

  // Enhanced connection status with handle
  getConnectionStatus(): { connected: boolean; handle: string | null } {
    return {
      connected: this.isTwitterConnected(),
      handle: this.userHandle
    };
  }
}

export const twitterService = new TwitterService();