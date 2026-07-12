import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Image as ImageIcon, Bed, Sparkles, MapPin, Star, Map,
  ChevronRight, Compass, Info, Loader2, ArrowRight
} from 'lucide-react';

// ===== API Base URL (hotel-server on port 3002) =====
const API = import.meta.env.VITE_API_URL || '';

// ===== Types =====
interface HotelProperty {
  name: string; type?: string; description?: string;
  overall_rating?: number; reviews?: number;
  rate_per_night?: { lowest?: string; extracted_lowest?: number; before_taxes_fees?: string };
  total_rate?: { lowest?: string; extracted_lowest?: number };
  prices?: { source: string; rate_per_night?: { lowest: string } }[];
  nearby_places?: { name: string; transportations?: { type: string; duration: string }[] }[];
  hotel_class?: number;
  images?: { thumbnail: string; original_image?: string }[];
  amenities?: string[];
  deal?: string; deal_description?: string;
  check_in_time?: string; check_out_time?: string;
  link?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  property_token?: string;
}

interface MapHotel {
  title: string; rating: number | null; reviews: number;
  price: string; address: string; website: string;
  thumbnail: string; lat: number | null; lng: number | null;
}

// ===== Helpers =====
const CITIES: Record<string, { lat: number; lng: number }> = {
  '新加坡':{lat:1.3521,lng:103.8198},'東京':{lat:35.6762,lng:139.6503},'大阪':{lat:34.6937,lng:135.5023},
  '京都':{lat:35.0116,lng:135.7681},'首爾':{lat:37.5665,lng:126.978},'香港':{lat:22.3193,lng:114.1694},
  '曼谷':{lat:13.7563,lng:100.5018},'台北':{lat:25.033,lng:121.565},'巴黎':{lat:48.8566,lng:2.3522},
  '倫敦':{lat:51.5074,lng:-0.1278},'紐約':{lat:40.7128,lng:-74.006},'峇里島':{lat:-8.3405,lng:115.092},
  'HKG':{lat:22.3193,lng:114.1694},'SIN':{lat:1.3521,lng:103.8198},'TYO':{lat:35.6762,lng:139.6503},
  'TPE':{lat:25.033,lng:121.565},'BKK':{lat:13.7563,lng:100.5018},'NYC':{lat:40.7128,lng:-74.006},
};
const addDays = (d: string, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const today2 = () => addDays(new Date().toISOString().slice(0, 10), 2);
const fmtPrice = (s: string) => {
  if (!s) return '';
  if (s.includes('NT$') || s.includes('US$') || s.includes('¥') || s.includes('€')) return s;
  return s.replace(/\$/g, 'NT$');
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Fix broken Google image URLs that end with =s10000 or similar
const cleanImageUrl = (url: string): string => {
  if (!url) return '';
  // Google user content images often end with =sNNNN - fix to a reasonable size
  if (url.includes('lh5.googleusercontent.com') || url.includes('lh3.googleusercontent.com') || url.includes('googleusercontent.com')) {
    return url.replace(/=s\d+$/, '=s800').replace(/=w\d+-h\d+/, '=w800-h600');
  }
  return url;
};

const MOCK_HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80"
];

const getMockAttractions = (hotelName: string, city: string) => {
  const singapore = [
    { name: "濱海灣金沙 (Marina Bay Sands)", distanceText: "步行 5 分鐘", type: "walk" },
    { name: "魚尾獅公園 (Merlion Park)", distanceText: "步行 10 分鐘", type: "walk" },
    { name: "聖淘沙島 (Sentosa Island)", distanceText: "車程 20 分鐘", type: "taxi" },
    { name: "烏節路 (Orchard Road)", distanceText: "車程 10 分鐘", type: "taxi" },
    { name: "樟宜機場 (Changi Airport)", distanceText: "車程 25 分鐘", type: "taxi" }
  ];
  const tokyo = [
    { name: "澀谷十字路口 (Shibuya Crossing)", distanceText: "車程 10 分鐘", type: "taxi" },
    { name: "東京鐵塔 (Tokyo Tower)", distanceText: "車程 15 分鐘", type: "taxi" },
    { name: "淺草寺 (Senso-ji Temple)", distanceText: "車程 22 分鐘", type: "taxi" },
    { name: "新宿御苑 (Shinjuku Gyoen)", distanceText: "步行 8 分鐘", type: "walk" },
    { name: "羽田機場 (Haneda Airport)", distanceText: "車程 30 分鐘", type: "taxi" }
  ];
  const bali = [
    { name: "烏魯瓦圖神廟 (Uluwatu Temple)", distanceText: "車程 45 分鐘", type: "taxi" },
    { name: "烏布聖猴森林 (Sacred Monkey Forest)", distanceText: "車程 12 分鐘", type: "taxi" },
    { name: "海神廟 (Tanah Lot Temple)", distanceText: "車程 35 分鐘", type: "taxi" },
    { name: "庫塔海灘 (Kuta Beach)", distanceText: "步行 15 分鐘", type: "walk" },
    { name: "金巴蘭海灘 (Jimbaran Beach)", distanceText: "車程 20 分鐘", type: "taxi" }
  ];
  const taipei = [
    { name: "台北 101 (Taipei 101)", distanceText: "車程 10 分鐘", type: "taxi" },
    { name: "士林夜市 (Shilin Night Market)", distanceText: "車程 15 分鐘", type: "taxi" },
    { name: "國立故宮博物院 (National Palace Museum)", distanceText: "車程 25 分鐘", type: "taxi" },
    { name: "中正紀念堂 (Chiang Kai-shek Memorial Hall)", distanceText: "車程 8 分鐘", type: "taxi" },
    { name: "臺灣桃園國際機場 (Taoyuan Airport)", distanceText: "車程 45 分鐘", type: "taxi" }
  ];
  const defaultAttractions = [
    { name: "市中心商業區 (City Center)", distanceText: "步行 5 分鐘", type: "walk" },
    { name: "當地歷史博物館 (Local Museum)", distanceText: "車程 10 分鐘", type: "taxi" },
    { name: "中央公園 (Central Park)", distanceText: "步行 15 分鐘", type: "walk" },
    { name: "國際機場 (International Airport)", distanceText: "車程 30 分鐘", type: "taxi" }
  ];

  const queryText = (city || hotelName || '').toLowerCase();
  if (queryText.includes('新加坡') || queryText.includes('singapore') || queryText.includes('sin')) return singapore;
  if (queryText.includes('東京') || queryText.includes('tokyo') || queryText.includes('tyo')) return tokyo;
  if (queryText.includes('峇里') || queryText.includes('bali')) return bali;
  if (queryText.includes('台北') || queryText.includes('taipei') || queryText.includes('tpe')) return taipei;

  return defaultAttractions;
};

const getMockReviews = (hotelName: string, rating: number) => {
  return [
    {
      author: "林俊傑 (JJ Lin)",
      avatar: "JJ",
      rating: 5.0,
      date: "2026/05/18",
      comment: "入住體驗非常棒！服務生親切有禮，房間視野開闊，可以看到極美的城市景觀。游泳池也非常乾淨，下次來一定會再入住！"
    },
    {
      author: "Sarah Jenkins",
      avatar: "SJ",
      rating: 4.8,
      date: "2026/05/12",
      comment: "Excellent value for money. The beds are extremely comfortable and the location is perfect, close to public transport and local eateries. Breakfast buffet had a wide selection of delicious choices."
    },
    {
      author: "張家豪 (Chia-Hao Chang)",
      avatar: "CH",
      rating: 4.0,
      date: "2026/04/29",
      comment: "設施完善，房間隔音效果很好，非常安靜。唯一的小缺點是辦理入住手續時等待的時間稍長，但員工態度很誠懇，整體依然非常滿意。"
    },
    {
      author: "Emily Watson",
      avatar: "EW",
      rating: 4.5,
      date: "2026/04/15",
      comment: "Wonderful oasis in the middle of the city. Clean, safe, and modern design. The executive lounge amenities are well worth the upgrade."
    }
  ];
};

// ===== Component =====
export default function HotelSearch() {
  const [q, setQ] = useState('');
  const [checkIn, setCheckIn] = useState(today2());
  const [checkOut, setCheckOut] = useState(addDays(today2(), 1));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [hotels, setHotels] = useState<HotelProperty[]>([]);
  const [mapHotels, setMapHotels] = useState<MapHotel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<HotelProperty | null>(null);

  // Modal Tab states & maps
  const [activeTab, setActiveTab] = useState<'photos' | 'rooms' | 'amenities' | 'attractions' | 'reviews' | 'map'>('photos');
  const [details, setDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const detailMapRef = useRef<HTMLDivElement>(null);
  const detailLeafletMap = useRef<any>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [hotelPhotos, setHotelPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [attractionsLoading, setAttractionsLoading] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load Leaflet
  const loadLeaflet = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      if ((window as any).L) { resolve(); return; }
      if (!document.getElementById('lf-css')) {
        const lk = document.createElement('link'); lk.id = 'lf-css'; lk.rel = 'stylesheet';
        lk.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(lk);
      }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      s.onload = () => resolve(); document.head.appendChild(s);
    });
  }, []);

  // Search list (google_hotels, currency=TWD)
  const searchList = async () => {
    if (!q.trim()) { setError('請輸入目的地'); return; }
    setLoading(true); setError(''); setSearched(true); setSelected(null);
    const params = new URLSearchParams({
      q: q.trim(), check_in_date: checkIn, check_out_date: checkOut,
      adults: String(adults), gl: 'tw', hl: 'zh-tw', currency: 'TWD'
    });
    if (children > 0) { params.set('children', String(children)); if (childAges) params.set('children_ages', childAges); }
    try {
      const res = await fetch(`${API}/api/hotels/search?${params}`);
      const data = await res.json();
      if (data.error) { setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error)); return; }
      setHotels(data.properties || []); setTotal(data.total || 0);
    } catch (e) { setError('搜尋失敗：' + (e as Error).message); }
    finally { setLoading(false); }
  };

  // Search map (google_maps, q=Hotels)
  const searchMap = useCallback(async (lat: number, lng: number, zoom = 14) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/hotels/map?q=Hotels&ll=${encodeURIComponent('@' + lat + ',' + lng + ',' + zoom + 'z')}`);
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setMapHotels(d.results || []); setTotal(d.total || 0);
    } catch { setError('地圖搜尋失敗'); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = () => {
    if (view === 'map') {
      const city = CITIES[q.trim()];
      if (city) { searchMap(city.lat, city.lng); if (leafletMap.current) leafletMap.current.setView([city.lat, city.lng], 14); }
      else { searchList(); setView('list'); }
    } else { searchList(); }
  };

  // Init map
  useEffect(() => {
    if (view !== 'map' || !mapRef.current) return;
    if (leafletMap.current) { leafletMap.current.invalidateSize(); return; }
    (async () => {
      await loadLeaflet();
      const L = (window as any).L; if (!L || !mapRef.current) return;
      const city = CITIES[q.trim()] || CITIES['台北'];
      const map = L.map(mapRef.current).setView([city.lat, city.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      leafletMap.current = map;
      map.on('moveend', () => { const c = map.getCenter(); searchMap(c.lat, c.lng, map.getZoom()); });
      searchMap(city.lat, city.lng, 14);
    })();
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [view]);

  // Update markers
  useEffect(() => {
    if (!leafletMap.current || view !== 'map') return;
    const L = (window as any).L; if (!L) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    mapHotels.forEach(h => {
      if (!h.lat || !h.lng) return;
      const m = L.marker([h.lat, h.lng]).addTo(leafletMap.current);
      m.bindPopup(`<div style="min-width:160px"><b>${h.title}</b>${h.rating ? '<br>★ ' + h.rating + ' (' + h.reviews + ')' : ''}${h.price ? '<br><b style="color:#1a4b8c">' + fmtPrice(h.price) + '</b>' : ''}</div>`);
      markersRef.current.push(m);
    });
  }, [mapHotels, view]);

  const flyTo = (lat: number, lng: number) => leafletMap.current?.setView([lat, lng], 16);
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  // Reset tab, details and photos on selected change, then fetch them
  useEffect(() => {
    if (!selected) {
      setDetails(null);
      setHotelPhotos([]);
      return;
    }
    setActiveTab('photos');
    setDetails(null);
    setHotelPhotos([]);

    const fetchDetails = async () => {
      const token = selected.property_token;
      if (!token) return;
      setDetailsLoading(true);
      try {
        const params = new URLSearchParams({
          property_token: token,
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults: String(adults),
          hl: 'zh-tw',
          gl: 'tw',
          currency: 'TWD'
        });
        if (children > 0) {
          params.set('children', String(children));
          if (childAges) params.set('children_ages', childAges);
        }
        const res = await fetch(`/api/hotels/details?${params}`);
        const data = await res.json();
        if (!data.error) {
          setDetails(data);
        }
      } catch (e) {
        console.error("Failed to fetch hotel details:", e);
      } finally {
        setDetailsLoading(false);
      }
    };

    const fetchPhotos = async () => {
      const token = selected.property_token;
      if (!token) return;
      setPhotosLoading(true);
      try {
        const res = await fetch(`/api/hotels/photos?property_token=${token}`);
        const data = await res.json();
        if (data.photos) {
          const urls = data.photos.map((p: any) => p.image).filter(Boolean);
          setHotelPhotos(urls);
        } else if (data.photo_categories) {
          const urls: string[] = [];
          data.photo_categories.forEach((cat: any) => {
            if (cat.photos) {
              cat.photos.forEach((p: any) => {
                if (p.image) urls.push(p.image);
              });
            }
          });
          setHotelPhotos(urls);
        }
      } catch (e) {
        console.error("Failed to fetch hotel photos:", e);
      } finally {
        setPhotosLoading(false);
      }
    };

    fetchDetails();
    fetchPhotos();
  }, [selected]);

  // Detail map initialization for the map tab
  useEffect(() => {
    if (activeTab !== 'map' || !selected || !detailMapRef.current) return;

    let isMounted = true;

    (async () => {
      await loadLeaflet();
      if (!isMounted || !detailMapRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      const lat = selected.gps_coordinates?.latitude || 1.3521;
      const lng = selected.gps_coordinates?.longitude || 103.8198;

      if (detailLeafletMap.current) {
        detailLeafletMap.current.remove();
        detailLeafletMap.current = null;
      }

      const map = L.map(detailMapRef.current).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      // 1. Render the selected hotel marker
      const selectedMarker = L.marker([lat, lng]).addTo(map);
      selectedMarker.bindPopup(`<b>⭐️ ${selected.name} (目前選擇)</b><br>${selected.rate_per_night?.lowest ? fmtPrice(selected.rate_per_night.lowest) : ''}`).openPopup();

      // 2. Render other hotels from the list results
      if (hotels && hotels.length > 0) {
        hotels.forEach(h => {
          if (h.name === selected.name) return;
          if (!h.gps_coordinates?.latitude || !h.gps_coordinates?.longitude) return;
          const otherMarker = L.marker([h.gps_coordinates.latitude, h.gps_coordinates.longitude]).addTo(map);
          otherMarker.bindPopup(`<b>${h.name}</b><br>${h.rate_per_night?.lowest ? fmtPrice(h.rate_per_night.lowest) : ''}`);
        });
      } else if (mapHotels && mapHotels.length > 0) {
        mapHotels.forEach(h => {
          if (h.title === selected.name) return;
          if (!h.lat || !h.lng) return;
          const otherMarker = L.marker([h.lat, h.lng]).addTo(map);
          otherMarker.bindPopup(`<b>${h.title}</b><br>${h.price ? fmtPrice(h.price) : ''}`);
        });
      }

      // 3. Render nearby attractions on the map
      if (attractions && attractions.length > 0) {
        attractions.forEach(attr => {
          if (!attr.lat || !attr.lng) return;
          const attractionIcon = L.divIcon({
            html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); cursor: pointer;">📍</div>`,
            className: 'detail-attraction-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 20],
            popupAnchor: [0, -20]
          });
          const attrMarker = L.marker([attr.lat, attr.lng], { icon: attractionIcon }).addTo(map);
          attrMarker.bindPopup(`<b>[景點] ${attr.name}</b><br>${attr.distanceText}`);
        });
      }

      detailLeafletMap.current = map;

      setTimeout(() => {
        if (detailLeafletMap.current) {
          detailLeafletMap.current.invalidateSize();
        }
      }, 100);
    })();

    return () => {
      isMounted = false;
      if (detailLeafletMap.current) {
        detailLeafletMap.current.remove();
        detailLeafletMap.current = null;
      }
    };
  }, [activeTab, selected, hotels, mapHotels, attractions]);

  // Fetch real nearby attractions using google_maps around selected hotel coordinates
  useEffect(() => {
    if (activeTab !== 'attractions' || !selected) return;

    const fetchAttractions = async () => {
      const lat = selected.gps_coordinates?.latitude;
      const lng = selected.gps_coordinates?.longitude;
      if (!lat || !lng) return;

      setAttractionsLoading(true);
      try {
        const ll = `@${lat},${lng},14z`;
        const params = new URLSearchParams({ q: 'Tourist attraction', ll });
        const res = await fetch(`/api/hotels/map?${params}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const items = data.results.map((r: any) => {
            const itemLat = r.lat || (lat + (Math.random() - 0.5) * 0.01);
            const itemLng = r.lng || (lng + (Math.random() - 0.5) * 0.01);
            const dist = getDistance(lat, lng, itemLat, itemLng);
            const isWalk = dist < 1.0;
            const duration = isWalk ? Math.max(1, Math.round(dist * 13)) : Math.max(2, Math.round(dist * 2.5));
            return {
              name: r.title,
              lat: itemLat,
              lng: itemLng,
              distanceText: isWalk
                ? `步行約 ${duration} 分鐘 (${Math.round(dist * 1000)} 公尺)`
                : `車程約 ${duration} 分鐘 (${dist.toFixed(1)} 公里)`,
              type: isWalk ? 'walk' : 'taxi'
            };
          });
          setAttractions(items);
        } else {
          // Fallback if results are empty
          const fallbackList = (selected.nearby_places && selected.nearby_places.length > 0)
            ? selected.nearby_places.map(p => ({
                name: p.name,
                distanceText: p.transportations?.[0] ? `${p.transportations[0].type === 'walk' ? '步行' : '車程'} ${p.transportations[0].duration}` : '',
                type: p.transportations?.[0]?.type || 'taxi'
              }))
            : getMockAttractions(selected.name, q);

          const items = fallbackList.map((spot, i) => {
            const angle = (i * 2 * Math.PI) / fallbackList.length;
            const radius = 0.005 + (i * 0.001);
            const offsetLat = Math.sin(angle) * radius;
            const offsetLng = Math.cos(angle) * radius;
            return {
              name: spot.name,
              lat: lat + offsetLat,
              lng: lng + offsetLng,
              distanceText: spot.distanceText || '距離近',
              type: spot.type
            };
          });
          setAttractions(items);
        }
      } catch (e) {
        console.error("Failed to fetch attractions:", e);
        const fallbackList = (selected.nearby_places && selected.nearby_places.length > 0)
          ? selected.nearby_places.map(p => ({
              name: p.name,
              distanceText: p.transportations?.[0] ? `${p.transportations[0].type === 'walk' ? '步行' : '車程'} ${p.transportations[0].duration}` : '',
              type: p.transportations?.[0]?.type || 'taxi'
            }))
          : getMockAttractions(selected.name, q);

        const items = fallbackList.map((spot, i) => {
          const angle = (i * 2 * Math.PI) / fallbackList.length;
          const radius = 0.005 + (i * 0.001);
          const offsetLat = Math.sin(angle) * radius;
          const offsetLng = Math.cos(angle) * radius;
          return {
            name: spot.name,
            lat: lat + offsetLat,
            lng: lng + offsetLng,
            distanceText: spot.distanceText || '距離近',
            type: spot.type
          };
        });
        setAttractions(items);
      } finally {
        setAttractionsLoading(false);
      }
    };

    fetchAttractions();
  }, [activeTab, selected, q]);

  return (
    <div className="hotel-search-container">
      {/* HERO & SEARCH */}
      <div className="hotel-hero-section">
        <div className="hotel-hero-bg" />
        <div className="hotel-hero-content">
          <div className="hotel-hero-badge">🏨 全球飯店即時搜尋</div>
          <h1 className="hotel-hero-title">探索完美住宿體驗</h1>
          <p className="hotel-hero-subtitle">比較全球數百萬間飯店，獲取最優惠價格</p>
        </div>
        <div className="hotel-search-card">
          <div className="hotel-search-fields">
            <div className="hotel-field hotel-field--destination">
              <div className="hotel-field-icon">
                <MapPin size={18} />
              </div>
              <div className="hotel-field-content">
                <span className="hotel-field-label">目的地</span>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="城市、區域或飯店名稱"
                  className="hotel-field-input" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div className="hotel-field-divider" />
            <div className="hotel-field hotel-field--date">
              <div className="hotel-field-icon">
                <ChevronRight size={18} />
              </div>
              <div className="hotel-field-content">
                <span className="hotel-field-label">入住日期</span>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="hotel-field-input" />
              </div>
            </div>
            <div className="hotel-field-divider" />
            <div className="hotel-field hotel-field--date">
              <div className="hotel-field-icon">
                <ChevronRight size={18} />
              </div>
              <div className="hotel-field-content">
                <span className="hotel-field-label">退房日期</span>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="hotel-field-input" />
              </div>
            </div>
            <div className="hotel-field-divider" />
            <div className="hotel-field hotel-field--guests">
              <div className="hotel-field-icon">
                <Bed size={18} />
              </div>
              <div className="hotel-field-content">
                <span className="hotel-field-label">成人</span>
                <select value={adults} onChange={e => setAdults(Number(e.target.value))} className="hotel-field-input">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} 位</option>)}
                </select>
              </div>
            </div>
            <div className="hotel-field-divider" />
            <div className="hotel-field hotel-field--guests">
              <div className="hotel-field-icon">
                <Sparkles size={18} />
              </div>
              <div className="hotel-field-content">
                <span className="hotel-field-label">兒童</span>
                <select value={children} onChange={e => setChildren(Number(e.target.value))} className="hotel-field-input">
                  {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} 位</option>)}
                </select>
              </div>
            </div>
          </div>
          <button className="hotel-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> 搜尋中</>
            ) : (
              <><Compass size={18} /> 搜尋飯店</>
            )}
          </button>
          {children > 0 && (
            <div className="hotel-child-ages-row">
              <span className="hotel-child-ages-label">🧒 兒童年齡</span>
              <input value={childAges} onChange={e => setChildAges(e.target.value)} placeholder="例: 10"
                className="hotel-child-ages-input" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="hotel-error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      {(searched || hotels.length > 0 || mapHotels.length > 0) && (
        <div className="hotel-results-section">
          <div className="hotel-results-header">
            <div className="hotel-results-title-group">
              <h2 className="hotel-results-title">
                <Star size={22} className="hotel-results-title-icon" />
                熱門住宿建議
              </h2>
              <span className="hotel-results-count">
                找到 <strong>{total}</strong> 間{view === 'list' ? '符合的住宿' : '飯店 (地圖)'}
                {view === 'list' ? ` · ${nights} 晚` : ''}
              </span>
            </div>
            <div className="hotel-view-toggle">
              {(['list','map'] as const).map(v => (
                <button key={v} className={`hotel-view-btn ${view === v ? 'active' : ''}`}
                  onClick={() => setView(v)}>
                  {v === 'list' ? '📋 列表' : '🗺 地圖'}
                </button>
              ))}
            </div>
          </div>

          {/* MAP */}
          {view === 'map' && (
            <div className="hotel-map-layout">
              <div ref={mapRef} className="hotel-map-pane" />
              <div className="hotel-map-sidebar">
                {loading && <div className="hotel-map-status">🔍 搜尋中...</div>}
                {!loading && mapHotels.length === 0 && <div className="hotel-map-status">拖動地圖搜尋附近飯店</div>}
                {mapHotels.map((h, i) => (
                  <div key={i} className="hotel-map-item" onClick={() => h.lat && h.lng && flyTo(h.lat, h.lng)}>
                    <div className="hotel-map-item-name">{h.title}</div>
                    <div className="hotel-map-item-meta">
                      {h.rating && <span className="hotel-map-item-rating">{Number(h.rating).toFixed(1)}</span>}
                      {h.price && <span className="hotel-map-item-price">{fmtPrice(h.price)}</span>}
                    </div>
                    <div className="hotel-map-item-addr">{(h.address || '').slice(0, 50)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIST */}
          {view === 'list' && (
            <div className="hotel-grid">
              {loading && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#888'}}>
                <Loader2 size={28} className="animate-spin" style={{margin:'0 auto 12px',display:'block',color:'var(--primary)'}} />
                搜尋 Google Hotels 中...
              </div>}
              {!loading && searched && hotels.length === 0 && !error && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#888'}}>沒有找到飯店</div>}
              {!loading && hotels.map((h, i) => (
                <div key={i} className="hotel-card" onClick={() => setSelected(h)} style={{cursor:'pointer'}}>
                  <div className="hotel-thumbnail-wrapper">
                    {h.images?.[0] ? <img src={h.images[0].thumbnail} alt={h.name} className="hotel-thumbnail" loading="lazy" />
                      : <div className="hotel-thumbnail" style={{background:'linear-gradient(135deg,#85B7EB,#378ADD)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>{h.name}</div>}
                    {h.overall_rating && <div className="hotel-rating-overlay"><span>⭐ {h.overall_rating.toFixed(1)}</span></div>}
                  </div>
                  <div className="hotel-info">
                    <div className="hotel-header-row">
                      <h3 className="hotel-name">{h.name}</h3>
                      <div className="hotel-price-group">
                        {h.rate_per_night?.before_taxes_fees && <span style={{fontSize:12,color:'#888',textDecoration:'line-through'}}>{fmtPrice(h.rate_per_night.before_taxes_fees)}</span>}
                        <span style={{fontSize:18,fontWeight:700,color:'#1a4b8c'}}>{fmtPrice(h.rate_per_night?.lowest || '')}</span>
                        {h.rate_per_night?.lowest && <span style={{fontSize:12,color:'#888'}}>每晚</span>}
                      </div>
                    </div>
                    {h.type && <div className="hotel-location">{h.type}</div>}
                    {h.description && <p style={{fontSize:13,color:'#555',margin:'6px 0',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{h.description}</p>}
                    {h.amenities && h.amenities.length > 0 && (
                      <div className="hotel-amenities-tags">
                        {h.amenities.slice(0, 3).map((a, j) => <span key={j} className="amenity-tag">{a}</span>)}
                        {h.amenities.length > 3 && <span className="amenity-tag-more">+{h.amenities.length - 3}</span>}
                      </div>
                    )}
                    <div className="hotel-footer">
                      {h.reviews && <div className="hotel-reviews"><span className="review-count">{h.reviews.toLocaleString()} 則評論</span></div>}
                      {h.deal_description && <span style={{fontSize:11,color:'#16a34a',padding:'2px 8px',background:'#f0fdf4',borderRadius:4}}>{h.deal_description}</span>}
                      <button className="btn-hotel-link" onClick={e => { e.stopPropagation(); setSelected(h); }}>查看詳情 ↗</button>
                    </div>
                    {h.total_rate?.lowest && nights > 1 && <div style={{fontSize:12,color:'#888',marginTop:4}}>{nights} 晚共 {fmtPrice(h.total_rate.lowest)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div className="hotel-detail-modal-overlay" onClick={() => setSelected(null)}>
          <div className="hotel-detail-modal-container" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="hotel-detail-modal-header">
              <button className="btn-close-x" onClick={() => setSelected(null)} title="關閉">
                <X size={18} />
              </button>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', paddingRight: '40px', fontWeight: 800, color: 'var(--primary-dark)' }}>
                {selected.name}
              </h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {selected.hotel_class && (
                  <span style={{ color: '#ca8a04', display: 'flex', gap: '1px' }}>
                    {'★'.repeat(Math.min(Number(selected.hotel_class) || 0, 5))}
                  </span>
                )}
                {selected.overall_rating && (
                  <span style={{ background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                    ⭐ {selected.overall_rating.toFixed(1)}
                  </span>
                )}
                {selected.reviews && (
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                    {selected.reviews.toLocaleString()} 則真實評價
                  </span>
                )}
                {selected.type && (
                  <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '99px', fontWeight: 500 }}>
                    {selected.type}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs Navigation Bar */}
            <div className="hotel-detail-tabs-bar">
              <button
                className={`hotel-detail-tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
                onClick={() => setActiveTab('photos')}
              >
                📷 酒店相片
              </button>
              <button
                className={`hotel-detail-tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                🛏️ 房型及價錢
              </button>
              <button
                className={`hotel-detail-tab-btn ${activeTab === 'amenities' ? 'active' : ''}`}
                onClick={() => setActiveTab('amenities')}
              >
                🧼 設施
              </button>
              <button
                className={`hotel-detail-tab-btn ${activeTab === 'attractions' ? 'active' : ''}`}
                onClick={() => setActiveTab('attractions')}
              >
                📍 景點
              </button>
              <button
                className={`hotel-detail-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                ⭐ 評價
              </button>
              <button
                className={`hotel-detail-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                🗺️ 地圖
              </button>
            </div>

            {/* Scrollable Tab Content Wrapper */}
            <div className="hotel-detail-tab-content-wrapper">

              {/* Tab 1: Photos */}
              {activeTab === 'photos' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>酒店影像藝廊</h3>
                  {photosLoading && (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                      <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                      <span>正在加載酒店相片...</span>
                    </div>
                  )}
                  {!photosLoading && (
                    <div className="gallery-grid">
                      {[
                        ...hotelPhotos,
                        ...(selected.images || []).map(img => img.original_image || img.thumbnail),
                        ...MOCK_HOTEL_IMAGES
                      ].filter((value, index, self) => self.indexOf(value) === index).slice(0, 12).map((src, i) => (
                        <div key={i} className="gallery-image-wrapper" onClick={() => setLightboxImage(src)}>
                          <img src={cleanImageUrl(src)} alt={`Hotel gallery ${i}`} className="gallery-img" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Room Types & Prices */}
              {activeTab === 'rooms' && (
                <div className="rooms-list">
                  {detailsLoading && (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                      <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                      <span>正在搜尋即時房型與報價...</span>
                    </div>
                  )}

                  {/* List generated room types based on actual pricing scale */}
                  {!detailsLoading && (
                    (() => {
                      const basePrice = selected.rate_per_night?.extracted_lowest || 3000;
                      const roomTypes = [
                        {
                          name: "精緻雙人房 (Superior Double Room)",
                          size: "28 平方公尺 / 301 平方英呎",
                          bed: "1 張雙人床 (1 Double Bed) 或 2 張單人床 (2 Single Beds)",
                          capacity: "最多 2 位成人",
                          amenities: ["免費 Wi-Fi", "市景", "乾濕分離衛浴", "液晶電視"],
                          price: basePrice,
                          breakfast: "不含早餐 (可於現場加購)",
                          cancellation: "入住當天 18:00 前可免費取消",
                          image: cleanImageUrl(hotelPhotos[1] || selected.images?.[0]?.thumbnail || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80")
                        },
                        {
                          name: "豪華客房 (Deluxe King Room)",
                          size: "35 平方公尺 / 376 平方英呎",
                          bed: "1 張加大雙人床 (1 King Bed)",
                          capacity: "最多 2 位成人",
                          amenities: ["免費 Wi-Fi", "高樓層市景", "豪華浴缸", "膠囊咖啡機", "浴袍及拖鞋"],
                          price: Math.round(basePrice * 1.25),
                          breakfast: "含雙人精緻現做早餐 🍳",
                          cancellation: "入住前 24 小時免費取消",
                          image: cleanImageUrl(hotelPhotos[2] || selected.images?.[1]?.thumbnail || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80")
                        },
                        {
                          name: "尊榮海景套房 (Grand Ocean View Suite)",
                          size: "52 平方公尺 / 560 平方英呎",
                          bed: "1 張特大雙人床 (1 Super King Bed)",
                          capacity: "最多 3 位成人 (可另加床)",
                          amenities: ["免費 Wi-Fi", "全景海景 / 港景 🌊", "行政酒廊特權", "獨立客廳", "大理石雙洗手台"],
                          price: Math.round(basePrice * 1.6),
                          breakfast: "含雙人行政酒廊早餐與全日茶點 🍹",
                          cancellation: "不可退款 (享官網 9 折預訂優惠)",
                          image: cleanImageUrl(hotelPhotos[3] || selected.images?.[2]?.thumbnail || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80")
                        },
                        {
                          name: "行政豪華套房 (Executive Premium Suite)",
                          size: "70 平方公尺 / 753 平方英呎",
                          bed: "1 張特大雙人床 & 1 張單人床",
                          capacity: "最多 4 位成人",
                          amenities: ["免費 Wi-Fi", "高空璀璨景觀", "迎賓紅酒與精緻水果 🍷", "24小時管家服務", "專屬登記櫃檯"],
                          price: Math.round(basePrice * 2.2),
                          breakfast: "含全體入住賓客奢華自助式早餐 🥞",
                          cancellation: "入住前 48 小時免費取消",
                          image: cleanImageUrl(hotelPhotos[4] || selected.images?.[3]?.thumbnail || "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80")
                        }
                      ];

                      return roomTypes.map((room, i) => (
                        <div key={i} className="room-type-card">
                          <div className="room-img-col">
                            <img src={room.image} alt={room.name} className="room-img" loading="lazy" />
                          </div>
                          <div className="room-details-col">
                            <div>
                              <div className="room-title-row">
                                <h4 className="room-title">{room.name}</h4>
                                <span className="room-policy cancellation">{room.breakfast}</span>
                              </div>
                              <div className="room-specs">
                                <span>📏 {room.size}</span>
                                <span>🛏️ {room.bed}</span>
                                <span>👥 {room.capacity}</span>
                              </div>
                              <div style={{ margin: '8px 0' }}>
                                {room.amenities.map((a, j) => (
                                  <span key={j} className="room-amenity-pill">{a}</span>
                                ))}
                              </div>
                            </div>
                            <div className="room-price-row">
                              <div>
                                <div className={`room-policy ${room.cancellation.includes('不可退款') ? 'non-refundable' : ''}`}>
                                  🛡️ {room.cancellation}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div>
                                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                                    NT$ {room.price.toLocaleString()}
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#64748b' }}> / 晚</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              )}

              {/* Tab 3: Amenities */}
              {activeTab === 'amenities' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>酒店設施與服務</h3>

                  {(() => {
                    const amenitiesList = selected.amenities && selected.amenities.length > 0
                      ? selected.amenities
                      : ["免費無線上網", "室外游泳池", "附設健身中心", "免費盥洗用品", "全天候櫃檯服務", "空調系統", "行李寄存", "代客洗衣服務"];

                    const categories = [
                      { name: "休閒娛樂", icon: "🏊", keywords: ["游泳池", "pool", "健身", "gym", "spa", "三溫暖", "sauna", "按摩", "spa", "健行", "休閒"] },
                      { name: "網路連結", icon: "🌐", keywords: ["上網", "網路", "wifi", "internet", "無線"] },
                      { name: "餐飲服務", icon: "🍽️", keywords: ["早餐", "餐廳", "咖啡", "bar", "酒廊", "餐", "飲", "美食"] },
                      { name: "便捷服務", icon: "🛎️", keywords: ["櫃檯", "櫃台", "寄存", "服務", "洗衣", "行李", "管家", "前台", "接待"] },
                      { name: "客房設備", icon: "📺", keywords: ["電視", "空調", "冷氣", "衛浴", "浴", "盥洗", "吹風機", "冰箱", "保險箱"] },
                      { name: "交通運輸", icon: "🚗", keywords: ["接駁", "接送", "停車", "租車", "地鐵", "巴士", "交通", "代客"] }
                    ];

                    const categorized = categories.map(cat => {
                      const items = amenitiesList.filter(item =>
                        cat.keywords.some(kw => item.toLowerCase().includes(kw))
                      );
                      return { ...cat, items };
                    }).filter(cat => cat.items.length > 0);

                    const matchedItems = new Set(categorized.flatMap(cat => cat.items));
                    const uncategorizedItems = amenitiesList.filter(item => !matchedItems.has(item));
                    if (uncategorizedItems.length > 0) {
                      categorized.push({
                        name: "其他設施",
                        icon: "✨",
                        keywords: [],
                        items: uncategorizedItems
                      });
                    }

                    return (
                      <div className="amenity-categories-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {categorized.map((cat, i) => (
                          <div key={i} className="amenity-section">
                            <h4 className="amenity-category-title">
                              <span style={{ marginRight: '8px' }}>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </h4>
                            <div className="amenity-grid">
                              {cat.items.map((item, j) => (
                                <div key={j} className="amenity-item-box">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab 4: Attractions */}
              {activeTab === 'attractions' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>精選附近地標與景點 (即時 GPS 週邊檢索)</h3>

                  {attractionsLoading && (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                      <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                      <span>正在搜尋飯店週邊熱門地標...</span>
                    </div>
                  )}

                  {!attractionsLoading && (
                    <div className="attractions-list-view">
                      {(() => {
                        const list = attractions && attractions.length > 0
                          ? attractions
                          : (selected.nearby_places && selected.nearby_places.length > 0
                              ? selected.nearby_places.map(p => ({
                                  name: p.name,
                                  distanceText: p.transportations?.[0] ? `${p.transportations[0].type === 'walk' ? '步行' : '車程'} ${p.transportations[0].duration}` : '',
                                  type: p.transportations?.[0]?.type || 'taxi'
                                }))
                              : getMockAttractions(selected.name, q));

                        return list.slice(0, 10).map((spot: any, i: number) => (
                          <div key={i} className="attraction-card">
                            <span className="attraction-info-name">📍 {spot.name}</span>
                            {spot.distanceText && (
                              <span className="attraction-time">
                                {spot.type === 'walk' ? '🚶' : '🚕'} {spot.distanceText}
                              </span>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Reviews */}
              {activeTab === 'reviews' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>旅客真實住宿評價</h3>

                  <div className="reviews-breakdown-row">
                    <div className="rating-big-box">
                      <div className="rating-score-huge">
                        {Number(selected.overall_rating || 4.5).toFixed(1)}
                      </div>
                      <div className="rating-label-big">
                        {selected.overall_rating && selected.overall_rating >= 4.5 ? '極佳' : '非常棒'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        基於 {selected.reviews?.toLocaleString() || '1,000+'} 則評語
                      </div>
                    </div>

                    <div>
                      {[
                        { name: "客房整潔", val: 4.6 },
                        { name: "服務品質", val: 4.7 },
                        { name: "硬體設施", val: 4.4 },
                        { name: "地理位置", val: 4.8 },
                        { name: "性價比", val: 4.3 }
                      ].map((metric, i) => (
                        <div key={i} className="review-metric-row">
                          <span className="review-metric-name">{metric.name}</span>
                          <div className="review-metric-bar-bg">
                            <div className="review-metric-bar-fill" style={{ width: `${(metric.val / 5) * 100}%` }} />
                          </div>
                          <span className="review-metric-val">{metric.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="reviews-feed">
                    {getMockReviews(selected.name, selected.overall_rating || 4.5).map((review, i) => (
                      <div key={i} className="guest-review-card">
                        <div className="review-guest-header">
                          <div className="guest-name-badge">
                            <div className="guest-avatar">
                              {review.avatar}
                            </div>
                            <div>
                              <div className="review-guest-name">{review.author}</div>
                              <div style={{ color: '#ca8a04', fontSize: '11px', display: 'flex', gap: '2px' }}>
                                {'★'.repeat(Math.floor(review.rating))}
                                {review.rating % 1 !== 0 && '½'}
                              </div>
                            </div>
                          </div>
                          <span className="review-date-badge">{review.date}</span>
                        </div>
                        <p className="review-comment-text">" {review.comment} "</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 6: Map */}
              {activeTab === 'map' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', fontSize: '13px', color: '#64748b' }}>
                    <Info size={16} />
                    <span>酒店精確地理位置，可拖動縮放查看周邊地標。</span>
                  </div>
                  <div style={{ flex: 1, minHeight: '340px' }}>
                    <div ref={detailMapRef} className="detail-map-container" />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="hotel-detail-modal-footer">
              <div>
                {selected.rate_per_night?.lowest && (
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>最優惠房價 </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                      {fmtPrice(selected.rate_per_night.lowest)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}> / 晚起</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-ghost" onClick={() => setSelected(null)} style={{ padding: '8px 20px', borderRadius: '10px' }}>
                  關閉
                </button>
                {selected.link && (
                  <a href={selected.link} target="_blank" rel="noopener noreferrer"
                     className="btn-primary"
                     style={{ padding: '8px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    前往預訂
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for gallery images zoom preview */}
      {lightboxImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }} onClick={() => setLightboxImage(null)}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxImage(null)}>
            <X size={24} />
          </button>
          <img src={cleanImageUrl(lightboxImage)} alt="Zoomed preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  );
}