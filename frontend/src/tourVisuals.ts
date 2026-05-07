export interface TourLike {
  tour_product_no: string;
  tour_product_name: string;
  arrival_city: string;
  region: string;
  city_code?: string;
  cover_color?: string;
  cover_image?: string;
}

export interface TourVisual {
  image: string;
  spot: string;
  tone: string;
  code: string;
  highlights: string[];
}

const TOUR_VISUALS: Record<string, Omit<TourVisual, 'code'>> = {
  東京: {
    image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1200&auto=format&fit=crop',
    spot: 'Tokyo Sakura',
    tone: '#d84f7a',
    highlights: ['上野公園賞櫻', '淺草散策', '晴空塔夜景'],
  },
  札幌: {
    image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1200&auto=format&fit=crop',
    spot: 'Hokkaido Onsen',
    tone: '#2f78a8',
    highlights: ['溫泉旅宿', '小樽運河', '季節花田'],
  },
  首爾: {
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=1200&auto=format&fit=crop',
    spot: 'Seoul City',
    tone: '#7c5cc4',
    highlights: ['明洞商圈', '景福宮', '韓式美食'],
  },
  羅馬: {
    image: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?q=80&w=1200&auto=format&fit=crop',
    spot: 'Roma Classica',
    tone: '#b4603a',
    highlights: ['古羅馬遺跡', '托斯卡尼風景', '義式餐酒'],
  },
  釜山: {
    image: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?q=80&w=1200&auto=format&fit=crop',
    spot: 'Busan Coast',
    tone: '#1588a5',
    highlights: ['海雲台', '甘川洞文化村', '海鮮市場'],
  },
  峇里島: {
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
    spot: 'Bali Resort',
    tone: '#178f75',
    highlights: ['烏布梯田', '海島度假', 'SPA 療程'],
  },
  京都: {
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
    spot: 'Kyoto Heritage',
    tone: '#9f6235',
    highlights: ['嵐山竹林', '清水寺', '奈良小鹿'],
  },
  蘇黎世: {
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop',
    spot: 'Swiss Alps',
    tone: '#416c91',
    highlights: ['少女峰景觀', '湖畔小鎮', '冰河列車'],
  },
};

export const getTourVisual = (tour: TourLike): TourVisual => {
  const visual = TOUR_VISUALS[tour.arrival_city] || TOUR_VISUALS[tour.region] || {
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
    spot: tour.arrival_city || tour.region || 'Travel Highlight',
    tone: tour.cover_color || '#185FA5',
    highlights: ['特色景點', '精選住宿', '團體安心安排'],
  };

  return {
    ...visual,
    image: tour.cover_image || visual.image,
    code: tour.city_code || tour.arrival_city?.slice(0, 2) || tour.region?.slice(0, 2) || 'GO',
  };
};
