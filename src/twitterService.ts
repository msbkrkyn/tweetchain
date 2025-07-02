// Twitter API Service - Ücretsiz Cross-Platform Posting
export interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface TwitterConfig {
  enabled: boolean;
  autoPost: boolean;
  addTweetChainTag: boolean;
  includeXPInfo: boolean;
}

export class TwitterService {
  private config: TwitterConfig = {
    enabled: false, // Başlangıçta kapalı
    autoPost: false,
    addTweetChainTag: true,
    includeXPInfo: true
  };

  private credentials: TwitterCredentials | null = null;

  // Twitter bağlantı durumunu kontrol et
  isTwitterConnected(): boolean {
    const connected = localStorage.getItem('twitter_connected') === 'true';
    if (connected) {
      const savedConfig = localStorage.getItem('twitter_config');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    }
    return connected;
  }

  // Kullanıcı Twitter hesabını bağla
  async connectTwitterAccount(): Promise<boolean> {
    try {
      // Simüle edilmiş Twitter OAuth
      const userConfirmed = window.confirm(
        '🐦 Twitter hesabınızı TweetChain\'e bağlamak istiyor musunuz?\n\n' +
        '✅ Tweet\'leriniz otomatik Twitter\'a da gönderilecek\n' +
        '✅ #TweetChain hashtag\'i ile viral olabilirsiniz\n' +
        '✅ Daha fazla XP kazanabilirsiniz'
      );

      if (userConfirmed) {
        // Simüle edilmiş başarılı bağlantı
        this.config.autoPost = true;
        this.config.enabled = true;
        
        // LocalStorage'a kaydet
        localStorage.setItem('twitter_connected', 'true');
        localStorage.setItem('twitter_config', JSON.stringify(this.config));
        
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('Twitter bağlantı hatası:', error);
      return false;
    }
  }

  // Twitter bağlantısını kes
  disconnectTwitter(): void {
    this.config.enabled = false;
    this.config.autoPost = false;
    this.credentials = null;
    
    localStorage.removeItem('twitter_connected');
    localStorage.removeItem('twitter_config');
    
    console.log('Twitter bağlantısı kesildi');
  }

  // Tweet'i Twitter'a da gönder
  async crossPostToTwitter(content: string, xpEarned: number): Promise<boolean> {
    try {
      // Şimdilik simülasyon - gerçek API yerine
      if (!this.config.enabled || !this.config.autoPost) {
        console.log('Twitter auto-post kapalı');
        return false;
      }

      // Tweet içeriğini hazırla
      let twitterContent = content;
      
      if (this.config.addTweetChainTag) {
        twitterContent += '\n\n#TweetChain #Web3 #Blockchain';
      }
      
      if (this.config.includeXPInfo) {
        twitterContent += `\n\n🔗 +${xpEarned} XP kazandım!`;
      }

      // Karakter limiti kontrolü (Twitter 280 karakter)
      if (twitterContent.length > 280) {
        twitterContent = twitterContent.substring(0, 277) + '...';
      }

      // Simüle edilmiş Twitter post
      console.log('Twitter\'a gönderiliyor:', twitterContent);
      
      // 2 saniye bekle (API simülasyonu)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Başarılı simülasyonu
      const success = Math.random() > 0.1; // %90 başarı oranı
      
      if (success) {
        console.log('Twitter\'a başarıyla gönderildi!');
        this.incrementCrossPostCount();
        return true;
      } else {
        console.log('Twitter gönderimi başarısız');
        return false;
      }

    } catch (error) {
      console.error('Twitter cross-post hatası:', error);
      return false;
    }
  }

  // Twitter entegrasyonunu etkinleştir
  enableTwitterIntegration(credentials: TwitterCredentials): void {
    this.credentials = credentials;
    this.config.enabled = true;
    console.log('Twitter entegrasyonu etkinleştirildi');
  }

  // Twitter'dan TweetChain'e import (gelecek özellik)
  async importFromTwitter(hashtag: string = '#TweetChain'): Promise<any[]> {
    try {
      // Simüle edilmiş Twitter verileri
      const mockTweets = [
        {
          id: 'twitter_1',
          content: 'TweetChain harika bir platform! #TweetChain #Web3',
          author: '@cryptofan',
          timestamp: Date.now() - 1000 * 60 * 30, // 30 dakika önce
          likes: 45,
          retweets: 12
        },
        {
          id: 'twitter_2', 
          content: 'Blockchain sosyal medya geleceği! #TweetChain',
          author: '@blockchaindev',
          timestamp: Date.now() - 1000 * 60 * 60, // 1 saat önce
          likes: 78,
          retweets: 23
        }
      ];

      console.log(`Twitter'dan ${hashtag} ile ${mockTweets.length} tweet bulundu`);
      return mockTweets;

    } catch (error) {
      console.error('Twitter import hatası:', error);
      return [];
    }
  }

  // Twitter ayarlarını güncelle
  updateTwitterSettings(newConfig: Partial<TwitterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('twitter_config', JSON.stringify(this.config));
  }

  // Twitter istatistikleri
  getTwitterStats() {
    return {
      connected: this.isTwitterConnected(),
      autoPostEnabled: this.config.autoPost,
      totalCrossPosts: parseInt(localStorage.getItem('twitter_crossposts') || '0'),
      lastPost: localStorage.getItem('twitter_last_post') || null
    };
  }

  // Cross-post sayacını artır
  private incrementCrossPostCount(): void {
    const current = parseInt(localStorage.getItem('twitter_crossposts') || '0');
    localStorage.setItem('twitter_crossposts', (current + 1).toString());
    localStorage.setItem('twitter_last_post', new Date().toISOString());
  }

  // Viral hashtag önerileri
  getViralHashtags(): string[] {
    return [
      '#TweetChain',
      '#Web3Revolution', 
      '#BlockchainSocial',
      '#DecentralizedTwitter',
      '#CryptoTwitter',
      '#SolanaEcosystem',
      '#DeFiSocial',
      '#NFTCommunity'
    ];
  }

  // Tweet önerisi oluştur
  generateTweetSuggestion(userXP: number, level: number): string {
    const suggestions = [
      `🚀 TweetChain'de Level ${level} oldum! ${userXP} XP ile blockchain sosyal medya deneyimi yaşıyorum! #TweetChain #Web3`,
      `💪 Her tweet'im blockchain'de kalıcı! TweetChain ile ${userXP} XP topladım. Gelecek burada! #TweetChain #Blockchain`,
      `🔗 Merkezi olmayan sosyal medya ile tanışın! Level ${level}, ${userXP} XP - TweetChain harika! #TweetChain #DeFi`,
      `⚡ Solana blockchain'de tweet atmak bu kadar kolaydı! ${userXP} XP ile yoluma devam ediyorum #TweetChain #Solana`
    ];
    
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  // API rate limit kontrolü
  checkRateLimit(): { canPost: boolean; resetTime?: number } {
    const lastPost = localStorage.getItem('twitter_last_post');
    const rateLimitCount = parseInt(localStorage.getItem('twitter_rate_count') || '0');
    
    if (!lastPost) {
      return { canPost: true };
    }
    
    const lastPostTime = new Date(lastPost).getTime();
    const now = Date.now();
    const timeDiff = now - lastPostTime;
    
    // 15 dakikada maksimum 5 post (Twitter API limiti)
    if (timeDiff < 15 * 60 * 1000 && rateLimitCount >= 5) {
      return { 
        canPost: false, 
        resetTime: lastPostTime + (15 * 60 * 1000)
      };
    }
    
    return { canPost: true };
  }
}

// Export singleton instance
export const twitterService = new TwitterService();