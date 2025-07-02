import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { contractService } from './contractService';
import { twitterService } from './twitterService';
import './App.css';

interface Tweet {
  id: number;
  username: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  retweets: number;
  comments: number;
  network: string;
  txHash?: string;
  xpEarned?: number;
  createdAt: number;
  hashtags: string[];
}

interface UserProfile {
  address: string;
  xp: number;
  totalTweets: number;
  hasBlueCheck: boolean;
  referrals: string[];
  referredBy?: string;
  level: number;
  tweetCoins: number;
  createdAt: number;
  bio: string;
  followers: string[];
  following: string[];
  totalEarnings: number;
}

interface LeaderboardUser {
  address: string;
  xp: number;
  level: number;
  totalEarnings: number;
  totalTweets: number;
  hasBlueCheck: boolean;
}

interface AnalyticsData {
  totalUsers: number;
  totalTweets: number;
  totalRevenue: number;
  dailyActiveUsers: number;
  growthRate: number;
  topHashtag: string;
}

interface Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    isConnected: boolean;
    publicKey: { toString: () => string } | null;
  };
  addEventListener: (event: string, handler: () => void) => void;
  removeEventListener: (event: string, handler: () => void) => void;
  innerWidth: number;
}

declare let window: Window;

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([
    {
      id: 1,
      username: "Satoshi Nakamoto",
      handle: "@satoshi",
      time: "2h",
      content: "Web3 sosyal medya devrimi başlıyor! 🚀 Blockchain üzerinde tweet atmak harika hissettiriyor. #TweetChain #Web3",
      likes: 1247,
      retweets: 892,
      comments: 234,
      network: "Solana",
      txHash: "5KJh7n8m9P2qR3tX4vB6nA8sE1wZ9yF3mL2kJ7hT6xR9",
      xpEarned: 10,
      createdAt: Date.now() - 7200000,
      hashtags: ["TweetChain", "Web3"]
    },
    {
      id: 2,
      username: "Crypto Enthusiast",
      handle: "@cryptolover",
      time: "4h",
      content: "TweetChain'de ilk tweet'im! Artık her tweet'im blockchain'de kalıcı olarak saklanıyor 💪 #Web3Revolution #TweetChain #Solana",
      likes: 567,
      retweets: 234,
      comments: 89,
      network: "Solana",
      txHash: "8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      xpEarned: 10,
      createdAt: Date.now() - 14400000,
      hashtags: ["Web3Revolution", "TweetChain", "Solana"]
    }
  ]);

  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'trending' | 'analytics'>('home');
  const [newTweet, setNewTweet] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('Solana');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [solBalance, setSolBalance] = useState<number>(0);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [isTwitterConnected, setIsTwitterConnected] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<{tag: string, count: number}[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 1567,
    totalTweets: 12450,
    totalRevenue: 5.67,
    dailyActiveUsers: 234,
    growthRate: 15.3,
    topHashtag: 'TweetChain'
  });
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    setIsTwitterConnected(twitterService.isTwitterConnected());
    generateMockData();
    checkIfMobile();
    
    const handleResize = () => checkIfMobile();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      updateUserProfile();
    }
  }, [walletAddress]);

  const checkIfMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const generateMockData = () => {
    const mockLeaderboard: LeaderboardUser[] = [
      { address: "9WzD...x7K2", xp: 2450, level: 24, totalEarnings: 1.234, totalTweets: 89, hasBlueCheck: true },
      { address: "4Fg8...m9L3", xp: 2100, level: 21, totalEarnings: 0.987, totalTweets: 76, hasBlueCheck: true },
      { address: "7Hn5...q4P1", xp: 1890, level: 18, totalEarnings: 0.756, totalTweets: 67, hasBlueCheck: false },
      { address: "2Bv9...k8R6", xp: 1654, level: 16, totalEarnings: 0.543, totalTweets: 58, hasBlueCheck: true },
      { address: "5Mt3...w2D9", xp: 1432, level: 14, totalEarnings: 0.432, totalTweets: 49, hasBlueCheck: false }
    ];
    setLeaderboard(mockLeaderboard);

    const hashtags = [
      { tag: "TweetChain", count: 1234 },
      { tag: "Web3", count: 987 },
      { tag: "Solana", count: 765 },
      { tag: "Web3Revolution", count: 543 },
      { tag: "Blockchain", count: 432 },
      { tag: "DeFi", count: 321 },
      { tag: "NFT", count: 298 },
      { tag: "Crypto", count: 267 }
    ];
    setTrendingHashtags(hashtags);
  };

  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const filterTweetsByHashtag = (hashtag: string) => {
    return tweets.filter(tweet => 
      tweet.hashtags.some(tag => tag.toLowerCase() === hashtag.toLowerCase())
    );
  };

  const checkWalletConnection = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        if (window.solana.isConnected && window.solana.publicKey) {
          setWalletAddress(window.solana.publicKey.toString());
          setIsConnected(true);
          
          const balance = await connection.getBalance(new PublicKey(window.solana.publicKey.toString()));
          setSolBalance(balance / LAMPORTS_PER_SOL);
        }
      }
    } catch (error) {
      console.log('Cüzdan kontrol hatası:', error);
      setSolBalance(2.45);
    }
  };

  const updateUserProfile = async () => {
    if (!walletAddress) return;
    
    try {
      let profile = await contractService.getUserProfile(walletAddress);
      
      if (!profile) {
        profile = {
          address: walletAddress,
          xp: 0,
          totalTweets: 0,
          hasBlueCheck: false,
          referrals: [],
          level: 1,
          tweetCoins: 0,
          createdAt: Date.now(),
          bio: '',
          followers: [],
          following: [],
          totalEarnings: 0
        };
      }
      
      setUserProfile(profile);
      
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      const fallbackProfile = {
        address: walletAddress,
        xp: 0,
        totalTweets: 0,
        hasBlueCheck: false,
        referrals: [],
        level: 1,
        tweetCoins: 0,
        createdAt: Date.now(),
        bio: '',
        followers: [],
        following: [],
        totalEarnings: 0
      };
      setUserProfile(fallbackProfile);
    }
  };

  const connectWallet = async () => {
    try {
      const solana = (window as any).solana;
      
      if (!solana) {
        alert('Phantom Wallet bulunamadı! Lütfen phantom.app adresinden yükleyin.');
        (window as any).open('https://phantom.app/', '_blank');
        return;
      }

      if (!solana?.isPhantom) {
        alert('Phantom Wallet algılanamadı! Lütfen tarayıcınızı yeniden başlatın.');
        return;
      }

      setIsConnecting(true);
      
      const response = await solana.connect({ onlyIfTrusted: false });
      
      console.log('Phantom bağlantısı başarılı:', response.publicKey.toString());
      
      setWalletAddress(response.publicKey.toString());
      setIsConnected(true);
      
      try {
        const balance = await connection.getBalance(new PublicKey(response.publicKey.toString()));
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch {
        setSolBalance(2.45);
      }
      
    } catch (error: any) {
      console.error('Phantom bağlantı hatası:', error);
      
      if (error.code === 4001) {
        alert('Bağlantı iptal edildi. Lütfen Phantom\'da "Connect" butonuna basın.');
      } else {
        alert('Bağlantı hatası: ' + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
      }
      setWalletAddress(null);
      setIsConnected(false);
      setSolBalance(0);
      setUserProfile(null);
    } catch (error) {
      console.error('Cüzdan bağlantı kesme hatası:', error);
    }
  };

  const handleTwitterToggle = async () => {
    if (isTwitterConnected) {
      twitterService.disconnectTwitter();
      setIsTwitterConnected(false);
      alert('🐦 Twitter bağlantısı kesildi!');
    } else {
      const connected = await twitterService.connectTwitterAccount();
      if (connected) {
        setIsTwitterConnected(true);
        alert('🎉 Twitter başarıyla bağlandı!\n\nArtık tweet\'leriniz otomatik olarak Twitter\'a da gönderilecek!');
      }
    }
  };

  const handleTweet = async () => {
    if (!newTweet.trim()) return;
    
    if (!isConnected || !userProfile) {
      alert('Önce cüzdanınızı bağlayın!');
      return;
    }

    if (solBalance < 0.001) {
      alert('❌ Yetersiz bakiye!\n\nTweet atmak için en az 0.001 SOL gerekiyor.\nMevcut bakiye: ' + solBalance.toFixed(6) + ' SOL');
      return;
    }

    try {
      setIsModalOpen(false);
      
      if (!isMobile) {
        alert('Tweet blockchain\'e gönderiliyor... ⏳\n\n💰 Fee: 0.001 SOL');
      }
      
      const txHash = await contractService.postTweet(walletAddress!, newTweet);
      const hashtags = extractHashtags(newTweet);
      
      const tweet: Tweet = {
        id: tweets.length + 1,
        username: userProfile.hasBlueCheck ? `${formatAddress(userProfile.address)} ✓` : formatAddress(userProfile.address),
        handle: `@${walletAddress?.substring(0, 8)}...`,
        time: "şimdi",
        content: newTweet,
        likes: 0,
        retweets: 0,
        comments: 0,
        network: selectedNetwork,
        txHash: txHash,
        xpEarned: 10,
        createdAt: Date.now(),
        hashtags: hashtags
      };
      
      setTweets([tweet, ...tweets]);
      setNewTweet('');
      
      const updatedTrending = [...trendingHashtags];
      hashtags.forEach(tag => {
        const existingIndex = updatedTrending.findIndex(t => t.tag.toLowerCase() === tag.toLowerCase());
        if (existingIndex >= 0) {
          updatedTrending[existingIndex].count++;
        } else {
          updatedTrending.push({ tag, count: 1 });
        }
      });
      setTrendingHashtags(updatedTrending.sort((a, b) => b.count - a.count));
      
      const updatedProfile = await contractService.getUserProfile(walletAddress!);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
      
      setSolBalance(prev => Math.max(0, prev - 0.001));
      
      setAnalytics(prev => ({
        ...prev,
        totalTweets: prev.totalTweets + 1,
        totalRevenue: prev.totalRevenue + 0.001
      }));
      
      if (isTwitterConnected) {
        try {
          const twitterSuccess = await twitterService.crossPostToTwitter(newTweet, 10);
          if (twitterSuccess) {
            alert(`🎉 Tweet başarıyla gönderildi!\n\n✅ Blockchain: ${txHash.substring(0, 10)}...\n🐦 Twitter: Başarıyla paylaşıldı!\n💰 Fee: 0.001 SOL\n🎯 +10 XP kazandınız!`);
          } else {
            alert(`🎉 Tweet blockchain'e kaydedildi!\n\n✅ TX: ${txHash.substring(0, 10)}...\n⚠️ Twitter gönderimi başarısız\n💰 Fee: 0.001 SOL\n🎯 +10 XP kazandınız!`);
          }
        } catch (error) {
          alert(`🎉 Tweet blockchain'e kaydedildi!\n\n✅ TX: ${txHash.substring(0, 10)}...\n💰 Fee: 0.001 SOL\n🎯 +10 XP kazandınız!`);
        }
      } else {
        alert(`🎉 Tweet başarıyla blockchain'e kaydedildi!\n\n💰 Fee: 0.001 SOL\n🎯 +10 XP kazandınız!\n📝 TX: ${txHash.substring(0, 10)}...\n\n💡 İpucu: Twitter'a da göndermek için hesabınızı bağlayın!`);
      }
      
    } catch (error: any) {
      console.error('Tweet gönderme hatası:', error);
      alert('❌ Tweet gönderilirken hata oluştu:\n\n' + error.message);
    }
  };

  const handleLike = async (id: number) => {
    if (!isConnected) {
      alert('Like yapmak için cüzdanınızı bağlayın!');
      return;
    }

    if (solBalance < 0.0001) {
      alert('❌ Yetersiz bakiye! Like yapmak için en az 0.0001 SOL gerekiyor.');
      return;
    }
    
    try {
      const txHash = await contractService.likeTweet(walletAddress!, `tweet_${id}`);
      
      setTweets(tweets.map(tweet =>
        tweet.id === id ? { ...tweet, likes: tweet.likes + 1 } : tweet
      ));
      
      const updatedProfile = await contractService.getUserProfile(walletAddress!);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
      
      setSolBalance(prev => Math.max(0, prev - 0.0001));
      
      setAnalytics(prev => ({
        ...prev,
        totalRevenue: prev.totalRevenue + 0.0001
      }));
      
      if (!isMobile) {
        alert('💖 Like başarılı!\n\n💰 Fee: 0.0001 SOL\n🎯 +1 XP');
      }
      
    } catch (error: any) {
      console.error('Like hatası:', error);
      alert('❌ Like işlemi başarısız: ' + error.message);
    }
  };

  const handleRetweet = async (id: number) => {
    if (!isConnected) {
      alert('Retweet yapmak için cüzdanınızı bağlayın!');
      return;
    }

    if (solBalance < 0.0005) {
      alert('❌ Yetersiz bakiye! Retweet yapmak için en az 0.0005 SOL gerekiyor.');
      return;
    }
    
    try {
      const txHash = await contractService.retweetTweet(walletAddress!, `tweet_${id}`);
      
      setTweets(tweets.map(tweet =>
        tweet.id === id ? { ...tweet, retweets: tweet.retweets + 1 } : tweet
      ));
      
      const updatedProfile = await contractService.getUserProfile(walletAddress!);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
      
      setSolBalance(prev => Math.max(0, prev - 0.0005));
      
      setAnalytics(prev => ({
        ...prev,
        totalRevenue: prev.totalRevenue + 0.0005
      }));
      
      if (!isMobile) {
        alert('🔄 Retweet başarılı!\n\n💰 Fee: 0.0005 SOL\n🎯 +5 XP');
      }
      
    } catch (error: any) {
      console.error('Retweet hatası:', error);
      alert('❌ Retweet işlemi başarısız: ' + error.message);
    }
  };

  const handleReferral = async () => {
    if (!referralCode.trim()) {
      alert('Referral kodu giriniz!');
      return;
    }
    
    if (!walletAddress || !userProfile || userProfile.referredBy) {
      alert('Referral kodu zaten kullanılmış!');
      return;
    }
    
    try {
      const success = await contractService.addReferral(walletAddress, referralCode);
      
      if (success) {
        const updatedProfile = await contractService.getUserProfile(walletAddress);
        if (updatedProfile) {
          setUserProfile(updatedProfile);
        }
        
        setReferralCode('');
        setShowReferralModal(false);
        alert('🎉 Referral kodu uygulandı! +50 XP bonus!');
      } else {
        alert('❌ Geçersiz referral kodu!');
      }
      
    } catch (error) {
      console.error('Referral hatası:', error);
      alert('Referral işlemi başarısız!');
    }
  };

  const generateReferralCode = () => {
    if (walletAddress) {
      return walletAddress.substring(0, 8).toUpperCase();
    }
    return '';
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const getXPProgress = () => {
    if (!userProfile) return 0;
    const currentLevelXP = userProfile.xp % 100;
    return (currentLevelXP / 100) * 100;
  };

  const handleUserClick = async (userAddress: string) => {
    try {
      const profile = await contractService.getUserProfile(userAddress);
      if (profile) {
        setSelectedUser(userAddress);
        setSelectedUserProfile(profile);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Kullanıcı profili alınamadı:', error);
    }
  };

  const handleFollow = async () => {
    if (!walletAddress || !selectedUser) return;
    
    try {
      const success = await contractService.followUser(walletAddress, selectedUser);
      if (success) {
        await updateUserProfile();
        const updatedSelectedProfile = await contractService.getUserProfile(selectedUser);
        if (updatedSelectedProfile) {
          setSelectedUserProfile(updatedSelectedProfile);
        }
        alert('✅ Kullanıcı takip edildi!');
      } else {
        alert('❌ Takip işlemi başarısız!');
      }
    } catch (error) {
      console.error('Takip hatası:', error);
      alert('❌ Takip işlemi başarısız!');
    }
  };

  const handleUnfollow = async () => {
    if (!walletAddress || !selectedUser) return;
    
    try {
      const success = await contractService.unfollowUser(walletAddress, selectedUser);
      if (success) {
        await updateUserProfile();
        const updatedSelectedProfile = await contractService.getUserProfile(selectedUser);
        if (updatedSelectedProfile) {
          setSelectedUserProfile(updatedSelectedProfile);
        }
        alert('✅ Takip bırakıldı!');
      } else {
        alert('❌ Takip bırakma işlemi başarısız!');
      }
    } catch (error) {
      console.error('Takip bırakma hatası:', error);
      alert('❌ Takip bırakma işlemi başarısız!');
    }
  };

  const handleBioUpdate = async () => {
    if (!walletAddress || !newBio.trim()) return;
    
    try {
      const success = await contractService.updateBio(walletAddress, newBio.trim());
      if (success) {
        await updateUserProfile();
        setEditingBio(false);
        setNewBio('');
        alert('✅ Bio güncellendi!');
      } else {
        alert('❌ Bio güncelleme başarısız!');
      }
    } catch (error) {
      console.error('Bio güncelleme hatası:', error);
      alert('❌ Bio güncelleme başarısız!');
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    setActiveTab('home');
  };

  const getFilteredTweets = () => {
    if (selectedHashtag) {
      return filterTweetsByHashtag(selectedHashtag);
    }
    return tweets;
  };

  const renderMobileBottomNav = () => {
    if (!isMobile) return null;

    return (
      <div className="mobile-bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {setActiveTab('home'); setSelectedHashtag(null);}}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Ana Sayfa</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          <span className="nav-icon">🔥</span>
          <span className="nav-label">Trending</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <span className="nav-icon">🏆</span>
          <span className="nav-label">Lider</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">İstatistik</span>
        </button>
      </div>
    );
  };

  const renderDesktopNav = () => {
    if (isMobile) return null;

    return (
      <div className="desktop-nav">
        <button 
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {setActiveTab('home'); setSelectedHashtag(null);}}
        >
          🏠 Ana Sayfa
        </button>
        <button 
          className={`nav-btn ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          🔥 Trending
        </button>
        <button 
          className={`nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Liderlik
        </button>
        <button 
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analitik
        </button>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'leaderboard':
        return (
          <div className="leaderboard-container">
            <div className="section-header">
              <h2>🏆 Liderlik Tablosu</h2>
              <p>En aktif ve başarılı TweetChain kullanıcıları</p>
            </div>
            
            <div className="leaderboard-tabs">
              <div className="tab-buttons">
                <button className="tab-btn active">👑 Top XP</button>
                <button className="tab-btn">💰 Top Earnings</button>
                <button className="tab-btn">📝 Most Tweets</button>
              </div>
            </div>

            <div className="leaderboard-list">
              {leaderboard.map((user, index) => (
                <div key={user.address} className="leaderboard-item">
                  <div className="rank">
                    <span className="rank-number">#{index + 1}</span>
                    {index < 3 && <span className="rank-medal">{['🥇', '🥈', '🥉'][index]}</span>}
                  </div>
                  
                  <div className="user-info">
                    <div className="user-main">
                      <span className="user-address">
                        {user.address} {user.hasBlueCheck && '✓'}
                      </span>
                      <span className="user-level">Level {user.level}</span>
                    </div>
                    <div className="user-stats">
                      <span className="stat">{user.xp} XP</span>
                      <span className="stat">{user.totalEarnings.toFixed(3)} SOL</span>
                      <span className="stat">{user.totalTweets} tweets</span>
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    <button className="follow-quick-btn">
                      {user.address === walletAddress ? '👤' : '➕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'trending':
        return (
          <div className="trending-container">
            <div className="section-header">
              <h2>🔥 Trending Hashtags</h2>
              <p>En popüler konular ve hashtagler</p>
            </div>
            
            <div className="trending-grid">
              {trendingHashtags.map((hashtag, index) => (
                <div 
                  key={hashtag.tag} 
                  className="hashtag-card"
                  onClick={() => handleHashtagClick(hashtag.tag)}
                >
                  <div className="hashtag-rank">#{index + 1}</div>
                  <div className="hashtag-content">
                    <h3 className="hashtag-name">#{hashtag.tag}</h3>
                    <p className="hashtag-count">{hashtag.count.toLocaleString()} tweet</p>
                  </div>
                  <div className="hashtag-trend">
                    <span className="trend-arrow">📈</span>
                    <span className="trend-change">+{Math.floor(Math.random() * 20 + 5)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="trending-insights">
              <h3>📊 Trending İstatistikleri</h3>
              <div className="insight-cards">
                <div className="insight-card">
                  <span className="insight-icon">🔥</span>
                  <div className="insight-content">
                    <h4>En Hızlı Yükselen</h4>
                    <p>#TweetChain (+45%)</p>
                  </div>
                </div>
                <div className="insight-card">
                  <span className="insight-icon">⚡</span>
                  <div className="insight-content">
                    <h4>Günün Trendi</h4>
                    <p>#Web3Revolution</p>
                  </div>
                </div>
                <div className="insight-card">
                  <span className="insight-icon">💎</span>
                  <div className="insight-content">
                    <h4>Popüler Kategori</h4>
                    <p>Blockchain Tech</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="analytics-container">
            <div className="section-header">
              <h2>📊 Platform Analitiği</h2>
              <p>TweetChain büyüme ve kullanım istatistikleri</p>
            </div>

            <div className="analytics-overview">
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <h3>{analytics.totalUsers.toLocaleString()}</h3>
                  <p>Toplam Kullanıcı</p>
                  <span className="metric-change positive">+{analytics.growthRate}%</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📝</div>
                <div className="metric-content">
                  <h3>{analytics.totalTweets.toLocaleString()}</h3>
                  <p>Toplam Tweet</p>
                  <span className="metric-change positive">+23%</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <h3>{analytics.totalRevenue.toFixed(2)} SOL</h3>
                  <p>Toplam Gelir</p>
                  <span className="metric-change positive">+18%</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🔥</div>
                <div className="metric-content">
                  <h3>{analytics.dailyActiveUsers}</h3>
                  <p>Günlük Aktif</p>
                  <span className="metric-change positive">+12%</span>
                </div>
              </div>
            </div>

            <div className="analytics-charts">
              <div className="chart-container">
                <h3>📈 Günlük Kullanıcı Büyümesi</h3>
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    {[65, 78, 82, 91, 88, 95, 100].map((height, index) => (
                      <div 
                        key={index} 
                        className="chart-bar" 
                        style={{ height: `${height}%` }}
                      >
                        <span className="bar-value">{Math.floor(height * 3.2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-labels">
                    <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
                  </div>
                </div>
              </div>

              <div className="chart-container">
                <h3>💰 Gelir Dağılımı</h3>
                <div className="revenue-breakdown">
                  <div className="revenue-item">
                    <span className="revenue-source">Tweet Fees</span>
                    <span className="revenue-amount">3.45 SOL (61%)</span>
                    <div className="revenue-bar" style={{ width: '61%' }}></div>
                  </div>
                  <div className="revenue-item">
                    <span className="revenue-source">Like Fees</span>
                    <span className="revenue-amount">1.23 SOL (22%)</span>
                    <div className="revenue-bar" style={{ width: '22%' }}></div>
                  </div>
                  <div className="revenue-item">
                    <span className="revenue-source">Retweet Fees</span>
                    <span className="revenue-amount">0.99 SOL (17%)</span>
                    <div className="revenue-bar" style={{ width: '17%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-insights">
              <h3>💡 Önemli İstatistikler</h3>
              <div className="insights-grid">
                <div className="insight-stat">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-text">Ortalama kullanıcı günde 3.2 tweet atıyor</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-icon">🎯</span>
                  <span className="stat-text">%78 kullanıcı mobil cihaz kullanıyor</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-text">En aktif saat: 14:00-16:00</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-icon">💎</span>
                  <span className="stat-text">Mavi tik sahipleri %15 daha aktif</span>
                </div>
              </div>
            </div>
          </div>
        );

      default: // home
        return (
          <div className="home-container">
            {!isConnected && (
              <div className="connection-prompt">
                <h2>🔗 Phantom Cüzdanınızı Bağlayın</h2>
                <p>TweetChain'de tweet atıp XP kazanmak için Phantom cüzdanınızı bağlamanız gerekiyor.</p>
                <div className="features-list">
                  <div className="feature">✨ Tweet başına 10 XP kazanın (0.001 SOL fee)</div>
                  <div className="feature">🏆 2 referral ile mavi tik alın</div>
                  <div className="feature">💰 XP'leri TweetCoin'e çevirin</div>
                  <div className="feature">🐦 Twitter'a otomatik paylaşım</div>
                </div>
                <button className="connect-wallet-btn big" onClick={connectWallet}>
                  🚀 Şimdi Bağla
                </button>
              </div>
            )}

            {isConnected && userProfile && (
              <div className="xp-progress-bar">
                <div className="progress-header">
                  <span>Level {userProfile.level} Progress</span>
                  <span>{userProfile.xp % 100}/100 XP</span>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{width: `${getXPProgress()}%`}}></div>
                </div>
              </div>
            )}

            {selectedHashtag && (
              <div className="hashtag-filter">
                <span className="filter-text">Gösteriliyor: #{selectedHashtag}</span>
                <button className="clear-filter" onClick={() => setSelectedHashtag(null)}>
                  ✕ Temizle
                </button>
              </div>
            )}

            <div className="tweets-container">
              {getFilteredTweets().map(tweet => (
                <div key={tweet.id} className="tweet-card">
                  <div className="tweet-header">
                    <div className="user-info">
                      <div className="avatar">
                        {tweet.username.charAt(0)}
                      </div>
                      <div className="user-details">
                        <h3 
                          className="username clickable-username" 
                          onClick={() => handleUserClick(formatAddress(tweet.username))}
                          style={{cursor: 'pointer', color: '#1da1f2'}}
                        >
                          {tweet.username}
                        </h3>
                        <p className="handle">{tweet.handle} • {tweet.time}</p>
                        {tweet.xpEarned && (
                          <span className="xp-badge">+{tweet.xpEarned} XP</span>
                        )}
                      </div>
                    </div>
                    <div className="network-badge">
                      {tweet.network}
                    </div>
                  </div>
                  
                  <div className="tweet-content">
                    <p>{tweet.content}</p>
                    {tweet.hashtags.length > 0 && (
                      <div className="tweet-hashtags">
                        {tweet.hashtags.map(tag => (
                          <span 
                            key={tag} 
                            className="hashtag-link"
                            onClick={() => handleHashtagClick(tag)}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="tweet-actions">
                    <button 
                      className="action-btn" 
                      onClick={() => handleLike(tweet.id)}
                      disabled={!isConnected}
                      title="0.0001 SOL fee"
                    >
                      ❤️ {tweet.likes} {isConnected && !isMobile && '(0.0001 SOL)'}
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => handleRetweet(tweet.id)}
                      disabled={!isConnected}
                      title="0.0005 SOL fee"
                    >
                      🔄 {tweet.retweets} {isConnected && !isMobile && '(0.0005 SOL)'}
                    </button>
                    <button className="action-btn" disabled={!isConnected}>
                      💬 {tweet.comments}
                    </button>
                    {tweet.txHash && (
                      <button 
                        className="action-btn tx-btn"
                        onClick={() => alert(`TX Hash: ${tweet.txHash}`)}
                      >
                        🔗 {isMobile ? 'TX' : tweet.txHash.substring(0, 8) + '...'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`App ${isMobile ? 'mobile' : 'desktop'}`}>
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">🔗 TweetChain</h1>
            {!isMobile && <p className="tagline">Web3 sosyal medya + Ücretli tweet sistemi</p>}
          </div>
          <div className="header-actions">
            {!isConnected ? (
              <button 
                className="connect-wallet-btn" 
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? '🔄' : '🔗'} {isMobile ? 'Bağla' : 'Phantom Cüzdanı Bağla'}
              </button>
            ) : (
              <div className="wallet-info">
                <div className="wallet-details">
                  <span className="wallet-address">
                    {userProfile?.hasBlueCheck ? '✓ ' : ''}{formatAddress(walletAddress!)}
                  </span>
                  {!isMobile && <span className="wallet-balance">{solBalance.toFixed(6)} SOL</span>}
                  {userProfile && !isMobile && (
                    <span className="xp-display">
                      Level {userProfile.level} • {userProfile.xp} XP • {userProfile.tweetCoins} TC
                    </span>
                  )}
                </div>
                <button className="profile-btn" onClick={() => setShowProfileModal(true)}>
                  👤
                </button>
                {!isMobile && (
                  <button className="disconnect-btn" onClick={disconnectWallet}>
                    ❌
                  </button>
                )}
              </div>
            )}
            
            {isConnected && !isMobile && (
              <button 
                className={`twitter-btn ${isTwitterConnected ? 'connected' : ''}`}
                onClick={handleTwitterToggle}
              >
                {isTwitterConnected ? '🐦 Twitter Bağlı' : '🐦 Twitter Bağla'}
              </button>
            )}
            
            <button 
              className="tweet-btn" 
              onClick={() => setIsModalOpen(true)}
              disabled={!isConnected}
            >
              {isMobile ? '📝' : '📝 Tweet At (0.001 SOL)'}
            </button>
          </div>
        </div>
      </header>

      {renderDesktopNav()}

      <main className="main-content">
        <div className="container">
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-number">{analytics.totalTweets.toLocaleString()}</span>
              <span className="stat-label">Toplam Tweet</span>
            </div>
            <div className="stat">
              <span className="stat-number">{analytics.totalUsers.toLocaleString()}</span>
              <span className="stat-label">Aktif Kullanıcı</span>
            </div>
            <div className="stat">
              <span className="stat-number">{isConnected ? 'Bağlı' : 'Bağlı Değil'}</span>
              <span className="stat-label">Cüzdan Durumu</span>
            </div>
            {!isMobile && (
              <>
                <div className="stat">
                  <span className="stat-number">{isTwitterConnected ? '🐦 Bağlı' : '🐦 Bağlı Değil'}</span>
                  <span className="stat-label">Twitter</span>
                </div>
                {userProfile && (
                  <div className="stat">
                    <span className="stat-number">{userProfile.xp}</span>
                    <span className="stat-label">Toplam XP</span>
                  </div>
                )}
              </>
            )}
          </div>

          {renderContent()}
        </div>
      </main>

      {renderMobileBottomNav()}

      {showProfileModal && userProfile && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Profil & XP Durumu</h2>
              <button className="close-btn" onClick={() => setShowProfileModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="profile-header">
                <div className="profile-info">
                  <h3>{formatAddress(userProfile.address)} {userProfile.hasBlueCheck ? '✓' : ''}</h3>
                  <div className="bio-section">
                    {editingBio ? (
                      <div className="bio-edit">
                        <textarea
                          value={newBio}
                          onChange={(e) => setNewBio(e.target.value)}
                          placeholder="Bio ekle... (100 karakter)"
                          maxLength={100}
                          className="bio-input"
                        />
                        <div className="bio-actions">
                          <button onClick={handleBioUpdate} className="save-bio-btn">
                            ✅ Kaydet
                          </button>
                          <button onClick={() => {setEditingBio(false); setNewBio('');}} className="cancel-bio-btn">
                            ❌ İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bio-display">
                        <p className="bio-text">{userProfile.bio || 'Bio eklenmemiş...'}</p>
                        <button 
                          onClick={() => {setEditingBio(true); setNewBio(userProfile.bio);}} 
                          className="edit-bio-btn"
                        >
                          ✏️ Bio Düzenle
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="social-stats">
                  <div className="social-stat">
                    <span className="social-number">{userProfile.following.length}</span>
                    <span className="social-label">Takip Edilen</span>
                  </div>
                  <div className="social-stat">
                    <span className="social-number">{userProfile.followers.length}</span>
                    <span className="social-label">Takipçi</span>
                  </div>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{userProfile.level}</span>
                  <span className="stat-name">Level</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{userProfile.xp}</span>
                  <span className="stat-name">Total XP</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{userProfile.tweetCoins}</span>
                  <span className="stat-name">TweetCoins</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{userProfile.totalTweets}</span>
                  <span className="stat-name">Tweets</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{userProfile.totalEarnings.toFixed(6)}</span>
                  <span className="stat-name">Creator Earnings (SOL)</span>
                </div>
              </div>

              <div className="blue-check-status">
                <h3>🔷 Mavi Tik Durumu</h3>
                {userProfile.hasBlueCheck ? (
                  <p className="success">✅ Mavi tik aktif!</p>
                ) : (
                  <div>
                    <p>2 kişiyi davet ederek mavi tik kazanın!</p>
                    <p>Şu anki davetler: {userProfile.referrals.length}/2</p>
                  </div>
                )}
              </div>

              <div className="referral-section">
                <h3>🎯 Referral Sistemi</h3>
                <div className="referral-code-display">
                  <label>Senin Referral Kodun:</label>
                  <div className="code-container">
                    <code>{generateReferralCode()}</code>
                    <button onClick={() => navigator.clipboard.writeText(generateReferralCode())}>
                      📋 Kopyala
                    </button>
                  </div>
                </div>
                
                {!userProfile.referredBy && (
                  <button 
                    className="referral-btn"
                    onClick={() => setShowReferralModal(true)}
                  >
                    🎁 Referral Kodu Gir (+50 XP)
                  </button>
                )}
              </div>

              <div className="twitter-stats">
                <h3>🐦 Twitter Entegrasyonu</h3>
                <p>Durum: {isTwitterConnected ? '✅ Bağlı' : '❌ Bağlı değil'}</p>
                {isTwitterConnected && (
                  <p>✨ Tweet'leriniz otomatik Twitter'a gönderiliyor!</p>
                )}
                {!isTwitterConnected && isMobile && (
                  <button 
                    className="twitter-connect-btn"
                    onClick={handleTwitterToggle}
                  >
                    🐦 Twitter Bağla
                  </button>
                )}
              </div>

              <div className="fee-stats">
                <h3>💰 Fee Bilgileri</h3>
                <p>Tweet fee: <strong>0.001 SOL</strong></p>
                <p>Like fee: <strong>0.0001 SOL</strong></p>
                <p>Retweet fee: <strong>0.0005 SOL</strong></p>
                <p>Treasury: <strong>Ad7fjL...vJdj</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUserModal && selectedUserProfile && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Kullanıcı Profili</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="profile-header">
                <div className="profile-info">
                  <h3>{formatAddress(selectedUserProfile.address)} {selectedUserProfile.hasBlueCheck ? '✓' : ''}</h3>
                  <p className="bio-text">{selectedUserProfile.bio || 'Bio eklenmemiş...'}</p>
                </div>
                
                <div className="social-stats">
                  <div className="social-stat">
                    <span className="social-number">{selectedUserProfile.following.length}</span>
                    <span className="social-label">Takip Edilen</span>
                  </div>
                  <div className="social-stat">
                    <span className="social-number">{selectedUserProfile.followers.length}</span>
                    <span className="social-label">Takipçi</span>
                  </div>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{selectedUserProfile.level}</span>
                  <span className="stat-name">Level</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedUserProfile.xp}</span>
                  <span className="stat-name">Total XP</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedUserProfile.tweetCoins}</span>
                  <span className="stat-name">TweetCoins</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedUserProfile.totalTweets}</span>
                  <span className="stat-name">Tweets</span>
                </div>
              </div>

              <div className="blue-check-status">
                <h3>🔷 Durum</h3>
                {selectedUserProfile.hasBlueCheck ? (
                  <p className="success">✅ Doğrulanmış kullanıcı!</p>
                ) : (
                  <p>Henüz doğrulanmamış kullanıcı</p>
                )}
              </div>

              {walletAddress && selectedUser && walletAddress !== selectedUser && (
                <div className="follow-section">
                  <button 
                    className="follow-btn"
                    onClick={() => {
                      if (userProfile?.following.includes(selectedUser)) {
                        handleUnfollow();
                      } else {
                        handleFollow();
                      }
                    }}
                  >
                    {userProfile?.following.includes(selectedUser) ? '❌ Takibi Bırak' : '➕ Takip Et'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Yeni Tweet</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <textarea
                value={newTweet}
                onChange={(e) => setNewTweet(e.target.value)}
                placeholder="Blockchain'de ne paylaşmak istiyorsun? Hashtag kullanmayı unutma! #TweetChain"
                className="tweet-input"
                maxLength={280}
              />
              
              <div className="tweet-options">
                <div className="network-selector">
                  <label>Ağ Seç:</label>
                  <select 
                    value={selectedNetwork} 
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                  >
                    <option value="Solana">Solana</option>
                    <option value="Ethereum">Ethereum</option>
                    <option value="BSC">BSC</option>
                  </select>
                </div>
                
                <div className="gas-info">
                  <p>Mevcut bakiye: <strong>{solBalance.toFixed(6)} SOL</strong></p>
                  <div className="fee-breakdown">
                    <p><strong>💰 Tweet Fee: 0.001 SOL (~$0.001)</strong></p>
                    <p>💎 XP kazancı: <strong>+10 XP</strong></p>
                    {isTwitterConnected && (
                      <p>🐦 <strong>Twitter'a da gönderilecek!</strong></p>
                    )}
                  </div>
                  <div className="treasury-info">
                    <p>💳 Treasury: Ad7fjL...vJdj</p>
                  </div>
                </div>
              </div>

              {solBalance < 0.001 && (
                <div className="insufficient-balance-warning">
                  ⚠️ <strong>Yetersiz bakiye!</strong> Tweet atmak için en az 0.001 SOL gerekiyor.
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="tweet-submit-btn"
                onClick={handleTweet}
                disabled={!newTweet.trim() || !isConnected || solBalance < 0.001}
              >
                🚀 {solBalance >= 0.001 ? 'Tweet Gönder (0.001 SOL)' : 'Yetersiz Bakiye'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReferralModal && (
        <div className="modal-overlay" onClick={() => setShowReferralModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎁 Referral Kodu Gir</h2>
              <button className="close-btn" onClick={() => setShowReferralModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>Seni davet eden kişinin kodunu gir ve 50 XP bonus kazan!</p>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Referral kodunu gir..."
                className="referral-input"
                maxLength={8}
              />
            </div>
            
            <div className="modal-footer">
              <button 
                className="referral-submit-btn"
                onClick={handleReferral}
                disabled={!referralCode.trim()}
              >
                ✅ Kodu Uygula (+50 XP)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;