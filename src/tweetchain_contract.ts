import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';

// TweetChain Contract Interface
export interface TweetData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  likes: number;
  retweets: number;
  ipfsHash?: string;
  // YENİ: Creator earnings tracking
  likeEarnings: number;
  retweetEarnings: number;
  totalEarnings: number;
}

export interface UserProfile {
  address: string;
  xp: number;
  level: number;
  totalTweets: number;
  hasBlueCheck: boolean;
  referrals: string[];
  referredBy?: string;
  tweetCoins: number;
  createdAt: number;
  // YENİ: Social Features
  bio: string;
  followers: string[];
  following: string[];
  totalEarnings: number; // Creator earnings
}

export class TweetChainContract {
  private connection: Connection;
  private programId: PublicKey;
  
  // Solana devnet bağlantısı (ücretsiz test ağı)
  constructor(rpcUrl: string = 'https://api.devnet.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    // Geçici program ID (gerçek deploy'da değişecek)
    this.programId = new PublicKey('11111111111111111111111111111112');
  }

  // Tweet gönderme fonksiyonu
  async postTweet(
    userWallet: PublicKey, 
    content: string, 
    payerKeypair: Keypair
  ): Promise<string> {
    try {
      // Tweet verilerini hazırla
      const tweetData: TweetData = {
        id: this.generateTweetId(),
        author: userWallet.toString(),
        content: content,
        timestamp: Date.now(),
        likes: 0,
        retweets: 0,
        // YENİ: Creator earnings alanları
        likeEarnings: 0,
        retweetEarnings: 0,
        totalEarnings: 0
      };

      // Simüle edilmiş blockchain işlemi
      const transaction = new Transaction();
      
      // Küçük SOL transfer (gas fee simülasyonu)
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: payerKeypair.publicKey,
        toPubkey: userWallet,
        lamports: 1000 // 0.000001 SOL
      });
      
      transaction.add(transferInstruction);
      
      // İşlemi gönder
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payerKeypair]
      );

      // Tweet'i "blockchain"e kaydet (şimdilik local storage simülasyonu)
      await this.saveTweetToStorage(tweetData);
      
      // Kullanıcıya XP ver
      await this.addXP(userWallet.toString(), 10);
      
      console.log('Tweet blockchain\'e kaydedildi:', signature);
      return signature;
      
    } catch (error) {
      console.error('Tweet gönderme hatası:', error);
      throw new Error('Tweet gönderilemedi');
    }
  }

  // Like işlemi
  async likeTweet(
    userWallet: PublicKey,
    tweetId: string,
    payerKeypair: Keypair
  ): Promise<string> {
    try {
      // Simüle edilmiş like işlemi
      const transaction = new Transaction();
      
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: payerKeypair.publicKey,
        toPubkey: userWallet,
        lamports: 500 // 0.0000005 SOL gas fee
      });
      
      transaction.add(transferInstruction);
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payerKeypair]
      );

      // Like sayısını artır ve creator'a ödeme yap
      await this.incrementLike(tweetId);
      
      // Kullanıcıya 1 XP ver
      await this.addXP(userWallet.toString(), 1);
      
      return signature;
      
    } catch (error) {
      console.error('Like hatası:', error);
      throw new Error('Like işlemi başarısız');
    }
  }

  // Retweet işlemi
  async retweetTweet(
    userWallet: PublicKey,
    tweetId: string,
    payerKeypair: Keypair
  ): Promise<string> {
    try {
      const transaction = new Transaction();
      
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: payerKeypair.publicKey,
        toPubkey: userWallet,
        lamports: 750 // 0.00000075 SOL gas fee
      });
      
      transaction.add(transferInstruction);
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payerKeypair]
      );

      // Retweet sayısını artır ve creator'a ödeme yap
      await this.incrementRetweet(tweetId);
      
      // Kullanıcıya 5 XP ver
      await this.addXP(userWallet.toString(), 5);
      
      return signature;
      
    } catch (error) {
      console.error('Retweet hatası:', error);
      throw new Error('Retweet işlemi başarısız');
    }
  }

  // Referral sistemi
  async addReferral(
    userWallet: PublicKey,
    referralCode: string
  ): Promise<boolean> {
    try {
      // Referral kodunu kontrol et
      const referrerAddress = this.decodeReferralCode(referralCode);
      
      if (!referrerAddress) {
        throw new Error('Geçersiz referral kodu');
      }

      // Kullanıcı profilini güncelle
      const userProfile = await this.getUserProfile(userWallet.toString());
      
      if (userProfile && !userProfile.referredBy) {
        userProfile.referredBy = referrerAddress;
        await this.saveUserProfile(userProfile);
        
        // Referral bonusu ver
        await this.addXP(userWallet.toString(), 50);
        
        // Referrer'a da bonus ver
        await this.addXP(referrerAddress, 25);
        
        // Referrer'ın referral listesine ekle
        await this.addToReferralList(referrerAddress, userWallet.toString());
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Referral hatası:', error);
      return false;
    }
  }

  // Kullanıcı takip et
  async followUser(followerAddress: string, targetAddress: string): Promise<boolean> {
    try {
      if (followerAddress === targetAddress) {
        throw new Error('Kendinizi takip edemezsiniz');
      }

      const followerProfile = await this.getUserProfile(followerAddress);
      const targetProfile = await this.getUserProfile(targetAddress);

      if (!followerProfile || !targetProfile) {
        throw new Error('Kullanıcı profilleri bulunamadı');
      }

      // Zaten takip ediyor mu kontrol et
      if (followerProfile.following.includes(targetAddress)) {
        throw new Error('Bu kullanıcıyı zaten takip ediyorsunuz');
      }

      // Takip listesine ekle
      followerProfile.following.push(targetAddress);
      targetProfile.followers.push(followerAddress);

      // Profilleri kaydet
      await this.saveUserProfile(followerProfile);
      await this.saveUserProfile(targetProfile);

      return true;
    } catch (error) {
      console.error('Takip etme hatası:', error);
      return false;
    }
  }

  // Takibi bırak
  async unfollowUser(followerAddress: string, targetAddress: string): Promise<boolean> {
    try {
      const followerProfile = await this.getUserProfile(followerAddress);
      const targetProfile = await this.getUserProfile(targetAddress);

      if (!followerProfile || !targetProfile) {
        throw new Error('Kullanıcı profilleri bulunamadı');
      }

      // Takip listesinden çıkar
      followerProfile.following = followerProfile.following.filter(addr => addr !== targetAddress);
      targetProfile.followers = targetProfile.followers.filter(addr => addr !== followerAddress);

      // Profilleri kaydet
      await this.saveUserProfile(followerProfile);
      await this.saveUserProfile(targetProfile);

      return true;
    } catch (error) {
      console.error('Takibi bırakma hatası:', error);
      return false;
    }
  }

  // Bio güncelle
  async updateBio(userAddress: string, newBio: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userAddress);
      if (!profile) return false;

      profile.bio = newBio.substring(0, 100); // 100 karakter limit
      await this.saveUserProfile(profile);
      return true;
    } catch (error) {
      console.error('Bio güncelleme hatası:', error);
      return false;
    }
  }

  // Creator'a ödeme yap (like/retweet geliri)
  async payCreator(creatorAddress: string, amount: number, action: string): Promise<void> {
    try {
      const creatorProfile = await this.getUserProfile(creatorAddress);
      if (!creatorProfile) return;

      // Creator'ın kazancını artır
      creatorProfile.totalEarnings += amount;
      await this.saveUserProfile(creatorProfile);

      // Payment kaydı
      const payments = JSON.parse(localStorage.getItem('creator_payments') || '[]');
      payments.push({
        creator: creatorAddress,
        amount,
        action,
        timestamp: Date.now()
      });
      localStorage.setItem('creator_payments', JSON.stringify(payments));

      console.log(`Creator ${creatorAddress} received ${amount} SOL from ${action}`);
    } catch (error) {
      console.error('Creator ödeme hatası:', error);
    }
  }

  // Mavi tik kontrolü
  async checkBlueCheckEligibility(userAddress: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userAddress);
      
      if (userProfile && userProfile.referrals.length >= 2) {
        // 2 veya daha fazla referral varsa mavi tik ver
        userProfile.hasBlueCheck = true;
        await this.saveUserProfile(userProfile);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Mavi tik kontrol hatası:', error);
      return false;
    }
  }

  // Kullanıcı profili al
  async getUserProfile(userAddress: string): Promise<UserProfile | null> {
    try {
      // LocalStorage'dan profil al (gerçek uygulamada blockchain'den gelecek)
      const profileData = localStorage.getItem(`profile_${userAddress}`);
      
      if (profileData) {
        const profile = JSON.parse(profileData);
        // Eski profilleri güncelle (yeni alanlar için)
        if (!profile.bio) profile.bio = '';
        if (!profile.followers) profile.followers = [];
        if (!profile.following) profile.following = [];
        if (typeof profile.totalEarnings === 'undefined') profile.totalEarnings = 0;
        
        await this.saveUserProfile(profile);
        return profile;
      }
      
      // Yeni profil oluştur
      const newProfile: UserProfile = {
        address: userAddress,
        xp: 0,
        level: 1,
        totalTweets: 0,
        hasBlueCheck: false,
        referrals: [],
        tweetCoins: 0,
        createdAt: Date.now(),
        // YENİ: Social features
        bio: '',
        followers: [],
        following: [],
        totalEarnings: 0
      };
      
      await this.saveUserProfile(newProfile);
      return newProfile;
      
    } catch (error) {
      console.error('Profil alma hatası:', error);
      return null;
    }
  }

  // Kullanıcı profili kaydet
  private async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      localStorage.setItem(`profile_${profile.address}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Profil kaydetme hatası:', error);
    }
  }

  // XP ekleme
  private async addXP(userAddress: string, xpAmount: number): Promise<void> {
    try {
      const profile = await this.getUserProfile(userAddress);
      
      if (profile) {
        profile.xp += xpAmount;
        profile.level = Math.floor(profile.xp / 100) + 1;
        profile.tweetCoins = Math.floor(profile.xp / 10);
        
        await this.saveUserProfile(profile);
      }
    } catch (error) {
      console.error('XP ekleme hatası:', error);
    }
  }

  // Tweet kaydetme (simülasyon)
  private async saveTweetToStorage(tweet: TweetData): Promise<void> {
    try {
      const tweets = this.getTweetsFromStorage();
      tweets.unshift(tweet);
      localStorage.setItem('tweetchain_tweets', JSON.stringify(tweets));
    } catch (error) {
      console.error('Tweet kaydetme hatası:', error);
    }
  }

  // Tweet'leri alma
  getTweetsFromStorage(): TweetData[] {
    try {
      const tweetsData = localStorage.getItem('tweetchain_tweets');
      return tweetsData ? JSON.parse(tweetsData) : [];
    } catch (error) {
      console.error('Tweet alma hatası:', error);
      return [];
    }
  }

  // Like artırma + Creator earnings
  private async incrementLike(tweetId: string): Promise<void> {
    try {
      const tweets = this.getTweetsFromStorage();
      const tweetIndex = tweets.findIndex(t => t.id === tweetId);
      
      if (tweetIndex !== -1) {
        tweets[tweetIndex].likes += 1;
        
        // Creator'a like earnings ekle
        const creatorEarning = 0.00005; // Like fee'nin yarısı
        tweets[tweetIndex].likeEarnings += creatorEarning;
        tweets[tweetIndex].totalEarnings += creatorEarning;
        
        // Creator'a ödeme yap
        await this.payCreator(tweets[tweetIndex].author, creatorEarning, 'like');
        
        localStorage.setItem('tweetchain_tweets', JSON.stringify(tweets));
      }
    } catch (error) {
      console.error('Like artırma hatası:', error);
    }
  }

  // Retweet artırma + Creator earnings
  private async incrementRetweet(tweetId: string): Promise<void> {
    try {
      const tweets = this.getTweetsFromStorage();
      const tweetIndex = tweets.findIndex(t => t.id === tweetId);
      
      if (tweetIndex !== -1) {
        tweets[tweetIndex].retweets += 1;
        
        // Creator'a retweet earnings ekle
        const creatorEarning = 0.00025; // Retweet fee'nin yarısı
        tweets[tweetIndex].retweetEarnings += creatorEarning;
        tweets[tweetIndex].totalEarnings += creatorEarning;
        
        // Creator'a ödeme yap
        await this.payCreator(tweets[tweetIndex].author, creatorEarning, 'retweet');
        
        localStorage.setItem('tweetchain_tweets', JSON.stringify(tweets));
      }
    } catch (error) {
      console.error('Retweet artırma hatası:', error);
    }
  }

  // Referral listesine ekleme
  private async addToReferralList(referrerAddress: string, newReferralAddress: string): Promise<void> {
    try {
      const referrerProfile = await this.getUserProfile(referrerAddress);
      
      if (referrerProfile) {
        referrerProfile.referrals.push(newReferralAddress);
        await this.saveUserProfile(referrerProfile);
        
        // Mavi tik kontrolü
        await this.checkBlueCheckEligibility(referrerAddress);
      }
    } catch (error) {
      console.error('Referral listesi hatası:', error);
    }
  }

  // Yardımcı fonksiyonlar
  private generateTweetId(): string {
    return `tweet_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private decodeReferralCode(code: string): string | null {
    // Basit referral kod çözümlemesi
    // Gerçek uygulamada daha güvenli bir sistem kullanılacak
    if (code.length === 8) {
      return code; // Şimdilik direkt kullanıcı adresinin ilk 8 karakteri
    }
    return null;
  }

  // Bağlantı kontrolü
  async checkConnection(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      console.log('Solana bağlantısı aktif:', version);
      return true;
    } catch (error) {
      console.error('Solana bağlantı hatası:', error);
      return false;
    }
  }
}

// Contract instance'ı export et
export const tweetChainContract = new TweetChainContract();