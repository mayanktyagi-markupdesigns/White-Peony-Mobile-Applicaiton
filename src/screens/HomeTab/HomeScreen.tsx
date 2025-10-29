import { HttpStatusCode } from 'axios';
import React, { useRef, useEffect, useState, useContext, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image_url, UserService } from '../../service/ApiService';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import Toast from 'react-native-toast-message';
import { UserData, UserDataContext } from '../../context/userDataContext';
import { WishlistContext } from '../../context/wishlistContext';
import AddressModal from '../../components/AddressModal';
import LoginModal from '../../components/LoginModal';
import { useCart } from '../../context/CartContext';
const { width } = Dimensions.get('window');

const banners = [require('../../assets/Png/banner.png')];

const products = new Array(6).fill(0).map((_, i) => ({
  id: String(i + 1),
  title: `Magic Queen Oolong ${i + 1}`,
  price: '24 €',
  stock: i === 2 ? 0 : 10,
  images: [
    require('../../assets/Png/product.png'),
    require('../../assets/Png/product3.png'),
    require('../../assets/Png/product.png'),
  ],
}));

const productscate = new Array(4)
  .fill(0)
  .map((_, i) => ({ id: String(i + 1), title: 'All Around Matcha' }));

// Small product image carousel used inside product cards
const ProductImageCarousel = ({ images }: { images: any[] }) => {
  const [index, setIndex] = useState(0);

  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (index + 1) % images.length;
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIndex(next);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const current = images && images.length ? images[index] : null;
  const source = typeof current === 'string' ? { uri: current } : current;

  return (
    <Animated.View style={{ opacity }}>
      {source ? (
        <Image source={source} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: '#eee' }]} />
      )}
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const { addToCart, removeFromCart, getCartDetails, syncCartAfterLogin } = useCart();

  const bannerRef = useRef<any>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [apiProducts, setApiProducts] = useState<any[]>(products);
  const [apiRecommend, setApiRecommend] = useState<any[]>(products);
  const [category, setApiCateProducts] = useState([]);
  const { showLoader, hideLoader } = CommonLoader();
  const { setUserData, isLoggedIn } = useContext<UserData>(UserDataContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [headerSimple, setheaderSimple] = useState([]);
  const [Promotional, setPromotional] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const smallItems = [
    {
      id: 's1',
      title: 'Gifts & Presents',
      image: require('../../assets/Png/banner.png'),
    },
    {
      id: 's2',
      title: 'Tea Sets',
      image: require('../../assets/Png/product.png'),
    },
    {
      id: 's3',
      title: 'Accessories',
      image: require('../../assets/Png/product.png'),
    },
  ];

  const [activeSmallIndex, setActiveSmallIndex] = useState(0);
  const [indexs, setIndex] = useState(0);
  const smallListRef = useRef<any>(null);
  const animatedValues = useRef(
    smallItems.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    GetProducts();
    RecommendProducts();
    GetCategoryProducts();
    Profile();
    GetHeader();
  }, []);

  const Profile = async () => {
    try {
      showLoader();
      const res = await UserService.profile();
      const GetProfile = res?.data?.user || {};
      setUserData(GetProfile);
      console.log("userprofile", GetProfile)
    } catch (e) {
      console.error('Wishlist fetch error:', e);
      Toast.show({ type: 'error', text1: 'Failed to load wishlist' });
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    Animated.timing(animatedValues[0], {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    const timer = setInterval(
      () => setActiveSmallIndex(prev => (prev + 1) % smallItems.length),
      3500,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    animatedValues.forEach((av, i) =>
      Animated.timing(av, {
        toValue: i === activeSmallIndex ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start(),
    );
    try {
      if (smallListRef.current?.scrollToIndex)
        smallListRef.current.scrollToIndex({
          index: activeSmallIndex,
          viewPosition: 0.5,
        });
    } catch (e) { }
  }, [activeSmallIndex]);

  const GetProducts = async () => {
    try {
      setIsLoadingProduct(true);
      const res = await UserService.product();
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        const fetchedProducts = res.data?.data || [];
        const baseUrl =
          res.data?.base_url ||
          'https://www.markupdesigns.net/whitepeony/storage/';
        const mapped = fetchedProducts.map((p: any) => {
          const images = [p.front_image, p.back_image, p.side_image]
            .filter(Boolean)
            .map((img: string) =>
              img.startsWith('http') ? img : `${baseUrl}${img}`,
            );
          const variant =
            p.variants && p.variants.length ? p.variants[0] : null;
          const price = variant?.price || p.main_price || '0';
          const unit = variant?.unit || '';
          return { ...p, images, price, unit };
        });
        setApiProducts(mapped.length ? mapped : fetchedProducts);
      } else {
        // handle non-OK response if needed
      }
    } catch (err) {
      // handle network/error
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const RecommendProducts = async () => {
    try {
      setIsLoadingProduct(true);
      const res = await UserService.recommended();
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        const fetchedProducts = res.data?.data || [];
        const baseUrl =
          res.data?.base_url ||
          'https://www.markupdesigns.net/whitepeony/storage/';
        const mapped = fetchedProducts.map((p: any) => {
          const images = [p.front_image, p.back_image, p.side_image]
            .filter(Boolean)
            .map((img: string) =>
              img.startsWith('http') ? img : `${baseUrl}${img}`,
            );
          const variant =
            p.variants && p.variants.length ? p.variants[0] : null;
          const price = variant?.price || p.main_price || '0';
          const unit = variant?.unit || '';
          return { ...p, images, price, unit };
        });
        setApiRecommend(mapped.length ? mapped : fetchedProducts);
      } else {
        // handle non-OK response if needed
      }
    } catch (err) {
      console.log(err)
      // handle network/error
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const GetHeader = async () => {
    try {
      setIsLoadingProduct(true);
      const res = await UserService.header();
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        const banners = res.data?.banners || [];

        const simpleBanners = banners.filter((item) => item.type === 'simple');
        const promotionalBanners = banners.filter((item) => item.type === 'promotional');

        const mappedSimple = simpleBanners.map((item) => ({
          ...item,
          image_url: Image_url + item.image_url,
        }));

        const mappedPromotional = promotionalBanners.map((item) => ({
          ...item,
          image_url: Image_url + item.image_url,
        }));
        setheaderSimple(mappedSimple)
        setPromotional(mappedPromotional)
      } else {
        // handle non-OK response if needed
      }
    } catch (err) {
      // handle network/error
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const GetCategoryProducts = async () => {
    try {
      setIsLoadingProduct(true);
      const res = await UserService.GetCategory();
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        const fetchedProducts = res.data?.categories || [];
        setApiCateProducts(fetchedProducts);
      } else {
        // handle non-OK response if needed
      }
    } catch (err) {
      // handle network/error
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Flexible search implementation (debounced)
  const GetSearch = useCallback(async (word: string) => {
    try {
      setIsSearching(true);
      // local spinner only
      const res = await UserService.search(word);
      if (res && (res.status === HttpStatusCode.Ok || res.status === 200)) {
        console.log("searching", res?.data?.data?.products)
        const dataRaw = Array.isArray(res.data?.data?.products) ? res.data?.data?.products : (res.data?.data?.products ?? res.data?.data?.products);
        const list = Array.isArray(dataRaw) ? dataRaw : [];
        const baseUrl = res?.data?.base_url || Image_url || '';
        const mapped = list.map((p: any) => {
          const images = [p.front_image, p.back_image, p.side_image]
            .filter(Boolean)
            .map((img: string) => (img.startsWith('http') ? img : `${baseUrl}${img}`));
          const variant = p.variants && p.variants.length ? p.variants[0] : null;
          const price = variant?.price || p.main_price || p.price || '0';
          const unit = variant?.unit || p.unit || '';
          return { ...p, images, price, unit };
        });
        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.log('errrsearch', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      GetSearch(trimmed);
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  };

  const { toggleWishlist, isWishlisted } = React.useContext(WishlistContext);

  const renderProduct = ({ item }: { item: any }) => {
    const qty = cart[item.id] || 0;
    const wished = isWishlisted(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ProductDetails', { productId: item.id })
        }
        activeOpacity={0.8}
      >
        <View style={{ position: 'relative' }}>
          <ProductImageCarousel
            images={item.images || [require('../../assets/Png/product.png')]}
          />
          <TouchableOpacity
            onPress={() => toggleWishlist(item.id)}
            activeOpacity={0.7}
            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E689', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 10, right: 10 }}
          >
            <Image
              source={wished ? require('../../assets/Png/heart1.png') : require('../../assets/Png/heart-1.png')}
              style={{ position: 'absolute', width: 15, height: 15, alignSelf: 'center' }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map(r => (
              <Text key={r} style={{ color: '#F0C419', fontSize: 18 }}>
                ★
              </Text>
            ))}
          </View>
          <Text style={styles.cardPrice}>
            {item.price}€ {item.unit ? `- ${item.unit}` : ''}
          </Text>

          {item.stock_quantity === 0 ? (
            <Text style={styles.outOfStock}>Out of Stock</Text>
          ) : (
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={async () => {
                if (item?.is_cart === "true") {
                  navigation.navigate('CheckoutScreen');
                  return;
                }
                try {
                  showLoader();
                  // wait for addToCart to complete (assumes it returns a promise)
                  const res = await addToCart(item?.id, item?.variants?.[0]?.id);
                  // call GetProducts to refresh product state after successful add
                  // optionally check res for success status if addToCart returns it
                  await GetProducts();
                  // optional success toast if addToCart doesn't already show one
                  // Toast.show({ type: 'success', text1: 'Added to cart' });
                } catch (err) {
                  console.log('Add to cart error:', err);
                  Toast.show({ type: 'error', text1: 'Failed to add to cart' });
                } finally {
                  hideLoader();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>{item?.is_cart === "true" ? 'Go to Cart' : 'Add to Bag'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductCate = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={{
        width: 'auto',
        height: 32,
        backgroundColor: indexs === index ? '#E2E689' : '#FFF',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
        paddingHorizontal: 10,
        margin: 5,
      }}
      onPress={() => setIndex(index)}
    >
      <View>
        <Text style={{ color: indexs === index ? '#000' : '#B4B4B4' }}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const PromotionalBanner = ({ promotional = [], }) => {
    if (!promotional.length) return null;

    return (
      <View style={{ marginTop: 10 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {promotional.map((item, index) => (
            <View key={String(index)} style={styles.page}>
              <ImageBackground
                source={{ uri: item.image_url }}
                style={styles.imageBackground}
                resizeMode='stretch'
              >
                <Text style={styles.title}>WHITE PEONY TEA CO</Text>
                <Text style={styles.subtitle}>
                  Best Organic Tea Delivered Worldwide
                </Text>

                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Shop Now</Text>
                </TouchableOpacity>
              </ImageBackground>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: '#FFF', height: 209 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/Png/headerLogo.png')}
              style={{ width: 140, height: 22, backgroundColor: 'transparent' }}
            />
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { isLoggedIn ? navigation.navigate('CheckoutScreen') : setModalVisible(true) }}>
            <Image
              source={require('../../assets/Png/order.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={'#707070'}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => searchQuery.trim() && GetSearch(searchQuery.trim())}
          />
          {isSearching ? (
            <ActivityIndicator style={{ marginLeft: 8 }} size="small" color="#2DA3C7" />
          ) : searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={{ marginLeft: 8 }}>
              <Text style={{ fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.microphone}>
              <Image
                source={require('../../assets/Png/search.png')}
                style={styles.iconSmall}
              />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={category}
          keyExtractor={i => i.id}
          renderItem={renderProductCate}
          showsHorizontalScrollIndicator={false}
          horizontal={true}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80, marginTop: 20 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={bannerRef}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          {headerSimple.map((item, index) => (
            <Image
              key={String(index)}
              source={{ uri: item.image_url }}
              style={[styles.banner, { width: width - 32 }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginVertical: 10,
          }}
        >
          <Text style={styles.sectionTitle}>Best Sale Products</Text>
          <Text style={{ color: '#AEB254', fontSize: 15 }}>See More</Text>
        </View>

        {isLoadingProduct ? (
          <SkeletonPlaceholder>
            <SkeletonPlaceholder.Item flexDirection="row" paddingLeft={16}>
              {new Array(4).fill(0).map((_, i) => (
                <SkeletonPlaceholder.Item
                  key={i}
                  width={177}
                  marginRight={8}
                  marginBottom={12}
                >
                  <SkeletonPlaceholder.Item
                    width={177}
                    height={245}
                    borderRadius={9}
                  />
                  <SkeletonPlaceholder.Item
                    marginTop={8}
                    width={120}
                    height={12}
                    borderRadius={4}
                  />
                  <SkeletonPlaceholder.Item
                    marginTop={6}
                    width={80}
                    height={12}
                    borderRadius={4}
                  />
                </SkeletonPlaceholder.Item>
              ))}
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder>
        ) : (
          <FlatList
            data={searchQuery.trim() ? searchResults : apiProducts}
            keyExtractor={i => i.id}
            renderItem={renderProduct}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={() =>
              searchQuery.trim() ? (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#666' }}>No results for "{searchQuery}"</Text>
                </View>
              ) : null
            }
          />
        )}

        <PromotionalBanner promotional={Promotional} />

        <View style={{ backgroundColor: '#FFF', paddingVertical: 12 }}>
          <Animated.FlatList
            ref={smallListRef}
            data={smallItems}
            keyExtractor={i => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: 16,
              paddingRight: 12,
              alignItems: 'center',
            }}
            renderItem={({ item, index }) => {
              const anim = animatedValues[index];
              const widthAnim = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [72, 169],
              });
              const opacity = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });
              return (
                <Animated.View
                  style={{
                    width: widthAnim,
                    height: 82,
                    marginRight: 12,
                    borderRadius: 8,
                    overflow: 'hidden',
                    zIndex: index === activeSmallIndex ? 2 : 1,
                    elevation: index === activeSmallIndex ? 4 : 0,
                  }}
                >
                  <Image source={item.image} style={styles.smallImage} />
                  <Animated.View style={[styles.smallOverlay, { opacity }]}>
                    <Text style={styles.smallOverlayText}>{item.title}</Text>
                  </Animated.View>
                </Animated.View>
              );
            }}
          />

          <LoginModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onGoogleLogin={() => Alert.alert("Google Login")}
            onFacebookLogin={() => Alert.alert("Facebook Login")}
            phoneNumber="email or phone number"
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginBottom: 10,
              marginTop: 10,
            }}
          >
            <Text style={styles.sectionTitle}>Recomended For You</Text>
            <Text style={{ color: '#AEB254', fontSize: 15 }}>See More</Text>
          </View>

          {isLoadingProduct ? (
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item flexDirection="row" paddingLeft={16}>
                {new Array(4).fill(0).map((_, i) => (
                  <SkeletonPlaceholder.Item
                    key={i}
                    width={177}
                    marginRight={8}
                    marginBottom={12}
                  >
                    <SkeletonPlaceholder.Item
                      width={177}
                      height={245}
                      borderRadius={9}
                    />
                    <SkeletonPlaceholder.Item
                      marginTop={8}
                      width={120}
                      height={12}
                      borderRadius={4}
                    />
                    <SkeletonPlaceholder.Item
                      marginTop={6}
                      width={80}
                      height={12}
                      borderRadius={4}
                    />
                  </SkeletonPlaceholder.Item>
                ))}
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder>
          ) : (
            <FlatList
              data={apiRecommend}
              keyExtractor={i => i.id}
              renderItem={renderProduct}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: '15%',
  },
  headerLeft: {},
  appTitle: { fontSize: 20, fontWeight: '700', color: '#0b3b2e' },
  headerRight: { flexDirection: 'row' },
  iconBtn: { position: 'absolute', right: 20 },
  icon: { width: 20, height: 20, tintColor: undefined },
  iconSmall: { width: 14, height: 14 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: '3%',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  },
  microphone: {
    marginLeft: 8,
    width: 60,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E689',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerScroll: { paddingLeft: 16, paddingRight: 16, marginBottom: 16, },
  banner: { height: 174, borderRadius: 12, marginRight: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 16,
    marginBottom: 8,
  },
  imageBackground: {
    width: '100%',
    height: 520,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    color: '#338AB1',
    marginTop: 0,
    fontWeight: '600',
  },
  page: {
    width, // full screen width for clean paging
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 20,
    color: '#000000',
    marginTop: 10,
    fontWeight: '400',
  },
  button: {
    width: '40%',
    alignSelf: 'center',
    backgroundColor: '#2DA3C7',
    borderRadius: 19,
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  card: { paddingHorizontal: 8 },
  CateView: {
    width: 'auto',
    height: 32,
    backgroundColor: '#E2E689',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    paddingHorizontal: 10,
    margin: 5,
  },
  cardImage: { width: 177, height: 245, borderRadius: 9 },
  cardBody: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '600' },
  cardPrice: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0b3b2e',
  },
  smallImage: { width: '100%', height: 120 },
  smallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  smallOverlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  addBtn: {
    marginTop: 10,
    backgroundColor: '#2DA3C7',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#E2E689',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2DA3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  qtyCount: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
    color: '#000',
  },
  outOfStock: { marginTop: 10, fontSize: 14, fontWeight: '600', color: 'red' },
  floatingCartPill: {
    position: 'absolute',
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    right: 0,
  },
  pillInner: {
    width: 200,
    backgroundColor: '#2DA3C7',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumb: { width: 40, height: 40, resizeMode: 'cover' },
  pillTextCol: { flex: 1 },
  pillTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pillSubtitle: { color: '#fff', fontSize: 12, marginTop: 2 },
  pillAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  pillActionText: { fontSize: 20, color: '#2DA3C7', fontWeight: '700' },
});