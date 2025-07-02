import { PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, Connection, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { tweetChainContract, TweetData, UserProfile } from './tweetchain_contract';

// TweetChain treasury hesabı
const TREASURY_WALLET = new PublicKey('Ad7fjLeykfgoSadqUx95dioNB8WiYa3YEwBUDhTEvJdj');
const TWEET_FEE_SOL = 0.001; // 0.001 SOL fee
const TWEET_FEE_LAMPORTS = TWEET_FEE_SOL * LAMPORTS_PER_SOL;

// Contract service class
export class ContractService {
  private contract = tweetChainContract;
  private connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Test keypair (gerçek uygulamada kullanıcının cüzdanı kullanılır)
  private testKeypair = Keypair.generate();

  async postTweet(userAddress: string, content: string): Promise<string> {
    try {
      const userPubkey = new PublicKey(userAddress);
      
      // Kullanıcının bakiyesini kontrol et
      const balance = await this.connection.getBalance(userPubkey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      
      if (balanceSOL < TWEET_FEE_SOL) {
        throw new Error(`Yetersiz bakiye! Tweet atmak için en az ${TWEET_FEE_SOL} SOL gerekiyor. Mevcut bakiye: ${balanceSOL.toFixed(6)} SOL`);
      }

      // Tweet fee transfer işlemi oluştur
      const transaction = new Transaction();
      
      // Treasury'ye fee gönder
      const feeTransferInstruction = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: TREASURY_WALLET,
        lamports: TWEET_FEE_LAMPORTS
      });
      
      transaction.add(feeTransferInstruction);
      
      // Simüle edilmiş işlem (gerçek uygulamada kullanıcı cüzdanı ile imzalanacak)
      console.log(`Tweet fee transferi: ${TWEET_FEE_SOL} SOL treasury'ye gönderiliyor...`);
      
      // Sahte transaction hash (gerçek işlem için)
      const signature = this.generateTransactionHash();
      
      // Tweet'i blockchain'e kaydet
      await this.contract.postTweet(userPubkey, content, this.testKeypair);
      
      // Fee payment kaydı
      this.recordFeePayment(userAddress, TWEET_FEE_SOL, signature);
      
      console.log(`Tweet başarıyla gönderildi! Fee: ${TWEET_FEE_SOL} SOL, TX: ${signature}`);
      return signature;
      
    } catch (error) {
      console.error('Tweet gönderme hatası:', error);
      throw error;
    }
  }

  async likeTweet(userAddress: string, tweetId: string): Promise<string> {
    try {
      const userPubkey = new PublicKey(userAddress);
      
      // Like için daha küçük fee (0.0001 SOL)
      const likeFee = 0.0001;
      const likeFeeLamports = likeFee * LAMPORTS_PER_SOL;
      
      const balance = await this.connection.getBalance(userPubkey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      
      if (balanceSOL < likeFee) {
        throw new Error(`Yetersiz bakiye! Like yapmak için en az ${likeFee} SOL gerekiyor.`);
      }

      // Like fee transfer
      const transaction = new Transaction();
      
      const feeTransferInstruction = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: TREASURY_WALLET,
        lamports: likeFeeLamports
      });
      
      transaction.add(feeTransferInstruction);
      
      const signature = this.generateTransactionHash();
      
      // Like'ı blockchain'e kaydet (creator earnings ile)
      await this.contract.likeTweet(userPubkey, tweetId, this.testKeypair);
      
      // Fee payment kaydı
      this.recordFeePayment(userAddress, likeFee, signature, 'like');
      
      return signature;
      
    } catch (error) {
      console.error('Like hatası:', error);
      throw error;
    }
  }

  async retweetTweet(userAddress: string, tweetId: string): Promise<string> {
    try {
      const userPubkey = new PublicKey(userAddress);
      
      // Retweet için orta fee (0.0005 SOL)
      const retweetFee = 0.0005;
      const retweetFeeLamports = retweetFee * LAMPORTS_PER_SOL;
      
      const balance = await this.connection.getBalance(userPubkey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      
      if (balanceSOL < retweetFee) {
        throw new Error(`Yetersiz bakiye! Retweet yapmak için en az ${retweetFee} SOL gerekiyor.`);
      }

      // Retweet fee transfer
      const transaction = new Transaction();
      
      const feeTransferInstruction = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: TREASURY_WALLET,
        lamports: retweetFeeLamports
      });
      
      transaction.add(feeTransferInstruction);
      
      const signature = this.generateTransactionHash();
      
      // Retweet'i blockchain'e kaydet (creator earnings ile)
      await this.contract.retweetTweet(userPubkey, tweetId, this.testKeypair);
      
      // Fee payment kaydı
      this.recordFeePayment(userAddress, retweetFee, signature, 'retweet');
      
      return signature;
      
    } catch (error) {
      console.error('Retweet hatası:', error);
      throw error;
    }
  }

  async addReferral(userAddress: string, referralCode: string): Promise<boolean> {
    try {
      const userPubkey = new PublicKey(userAddress);
      return await this.contract.addReferral(userPubkey, referralCode);
    } catch (error) {
      console.error('Referral hatası:', error);
      return false;
    }
  }

  async getUserProfile(userAddress: string): Promise<UserProfile | null> {
    try {
      return await this.contract.getUserProfile(userAddress);
    } catch (error) {
      console.error('Profil alma hatası:', error);
      return null;
    }
  }

  async checkBlueCheckEligibility(userAddress: string): Promise<boolean> {
    try {
      return await this.contract.checkBlueCheckEligibility(userAddress);
    } catch (error) {
      console.error('Mavi tik kontrol hatası:', error);
      return false;
    }
  }

  getTweets(): TweetData[] {
    try {
      return this.contract.getTweetsFromStorage();
    } catch (error) {
      console.error('Tweet alma hatası:', error);
      return [];
    }
  }

  async checkConnection(): Promise<boolean> {
    return await this.contract.checkConnection();
  }

  // Kullanıcı bakiyesini kontrol et
  async getUserBalance(userAddress: string): Promise<number> {
    try {
      const userPubkey = new PublicKey(userAddress);
      const balance = await this.connection.getBalance(userPubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Bakiye kontrol hatası:', error);
      return 0;
    }
  }

  // Fee bilgilerini al
  getFeeInfo() {
    return {
      tweetFee: TWEET_FEE_SOL,
      likeFee: 0.0001,
      retweetFee: 0.0005,
      treasuryWallet: TREASURY_WALLET.toString()
    };
  }

  // Fee payment kayıt
  private recordFeePayment(userAddress: string, amount: number, txHash: string, action: string = 'tweet') {
    try {
      const payments = JSON.parse(localStorage.getItem('fee_payments') || '[]');
      const newPayment = {
        userAddress,
        amount,
        txHash,
        action,
        timestamp: Date.now(),
        treasuryWallet: TREASURY_WALLET.toString()
      };
      
      payments.push(newPayment);
      localStorage.setItem('fee_payments', JSON.stringify(payments));
      
      // Treasury stats güncelle
      this.updateTreasuryStats(amount);
      
    } catch (error) {
      console.error('Fee payment kayıt hatası:', error);
    }
  }

  // Treasury istatistikleri güncelle
  private updateTreasuryStats(amount: number) {
    try {
      const stats = JSON.parse(localStorage.getItem('treasury_stats') || '{"totalCollected": 0, "totalTransactions": 0}');
      stats.totalCollected += amount;
      stats.totalTransactions += 1;
      stats.lastUpdate = Date.now();
      
      localStorage.setItem('treasury_stats', JSON.stringify(stats));
    } catch (error) {
      console.error('Treasury stats hatası:', error);
    }
  }

  // Treasury istatistiklerini al
  getTreasuryStats() {
    try {
      return JSON.parse(localStorage.getItem('treasury_stats') || '{"totalCollected": 0, "totalTransactions": 0}');
    } catch (error) {
      return { totalCollected: 0, totalTransactions: 0 };
    }
  }

  // Kullanıcının fee geçmişini al
  getUserFeeHistory(userAddress: string) {
    try {
      const payments = JSON.parse(localStorage.getItem('fee_payments') || '[]');
      return payments.filter((payment: any) => payment.userAddress === userAddress);
    } catch (error) {
      return [];
    }
  }

  private generateTransactionHash(): string {
    return `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  generateReferralCode(userAddress: string): string {
    return userAddress.substring(0, 8).toUpperCase();
  }

  // YENİ: Social Features
  async followUser(followerAddress: string, targetAddress: string): Promise<boolean> {
    try {
      return await this.contract.followUser(followerAddress, targetAddress);
    } catch (error) {
      console.error('Takip etme hatası:', error);
      return false;
    }
  }

  async unfollowUser(followerAddress: string, targetAddress: string): Promise<boolean> {
    try {
      return await this.contract.unfollowUser(followerAddress, targetAddress);
    } catch (error) {
      console.error('Takibi bırakma hatası:', error);
      return false;
    }
  }

  async updateBio(userAddress: string, newBio: string): Promise<boolean> {
    try {
      return await this.contract.updateBio(userAddress, newBio);
    } catch (error) {
      console.error('Bio güncelleme hatası:', error);
      return false;
    }
  }

  // Creator earnings istatistikleri
  getCreatorEarnings(userAddress: string) {
    try {
      const payments = JSON.parse(localStorage.getItem('creator_payments') || '[]');
      const userPayments = payments.filter((payment: any) => payment.creator === userAddress);
      
      const totalEarnings = userPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      const likeEarnings = userPayments.filter((p: any) => p.action === 'like').reduce((sum: number, p: any) => sum + p.amount, 0);
      const retweetEarnings = userPayments.filter((p: any) => p.action === 'retweet').reduce((sum: number, p: any) => sum + p.amount, 0);
      
      return {
        totalEarnings,
        likeEarnings,
        retweetEarnings,
        totalTransactions: userPayments.length
      };
    } catch (error) {
      return { totalEarnings: 0, likeEarnings: 0, retweetEarnings: 0, totalTransactions: 0 };
    }
  }

  // Takip durumunu kontrol et
  async isFollowing(followerAddress: string, targetAddress: string): Promise<boolean> {
    try {
      const followerProfile = await this.getUserProfile(followerAddress);
      return followerProfile?.following.includes(targetAddress) || false;
    } catch (error) {
      return false;
    }
  }
}

export const contractService = new ContractService();