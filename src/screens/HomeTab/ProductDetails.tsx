import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import Video from 'react-native-video';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors } from '../../constant';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = 300;

import { useNavigation } from '@react-navigation/native';
import { UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import Toast from 'react-native-toast-message';
import { formatDate } from '../../helpers/helpers';
import { WishlistContext } from '../../context';

// Lightweight skeleton placeholder (no external deps) - pulsing blocks
const SkeletonPlaceholderFull: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skelContainer, { opacity }]}>
      <View style={styles.headerRow}>
        <Animated.View style={styles.skelCircle} />
        <Animated.View style={styles.skelRectSmall} />
      </View>

      <Animated.View style={styles.skelHero} />

      <View style={{ padding: 16 }}>
        <Animated.View style={styles.skelTitle} />
        <Animated.View style={styles.skelTitleShort} />

        <View
          style={{
            flexDirection: 'row',
            marginTop: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Animated.View style={styles.skelPrice} />
          <Animated.View style={styles.skelDropdown} />
        </View>

        <View style={{ height: 12 }} />
        <Animated.View style={styles.skelDescLine} />
        <Animated.View style={styles.skelDescLineShort} />

        <View style={{ height: 20 }} />
        <Animated.View style={styles.skelSectionTitle} />
        <View style={{ height: 12 }} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.skelCard}>
              <Animated.View style={styles.skelCardImage} />
              <Animated.View style={styles.skelCardTitle} />
            </View>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

type ProductDetailsProps = {
  route: { params: { productId: string } };
};

const ProductDetails = ({ route }: ProductDetailsProps) => {
  const { productId: proDuctID } = route.params;
  const navigation = useNavigation<any>();
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const { toggleWishlist, isWishlisted } = React.useContext(WishlistContext);
  const [productData, setProductData] = useState<any>(null);
  //console.log('productData-------->', productData);
  const [baseUrl, setBaseUrl] = useState<string>(
    'https://www.markupdesigns.net/whitepeony/storage/',
  );
  const [displayPrice, setDisplayPrice] = useState<any>('0');
  const [displayUnit, setDisplayUnit] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState(null);

  const GetProducts = async () => {
    try {
      setIsLoadingProduct(true);
      const res = await UserService.productDetail(proDuctID);
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        const fetchedProducts = res.data?.data || [];
        const resolvedBase = res.data?.base_url || baseUrl;
        setBaseUrl(resolvedBase);

        const first = Array.isArray(fetchedProducts)
          ? fetchedProducts[0]
          : fetchedProducts;

        if (first) {
          // ✅ Normalize images
          const images = [first.front_image, first.back_image, first.side_image]
            .filter(Boolean)
            .map((img) => (img.startsWith('http') ? img : `${resolvedBase}${img}`));

          const extraImgs = (first.images || []).map((img) =>
            img.startsWith('http') ? img : `${resolvedBase}${img}`,
          );

          const allImages = extraImgs.length ? extraImgs : images;

          // ✅ Handle variants
          const allVariants = first.variants || [];
          setVariants(allVariants);

          // prepare dropdown items (for DropDownPicker)
          const variantItems = allVariants.map((v, index) => ({
            label: `${v.weight || v.unit || v.name} - ₹${v.price}`,
            value: v.id, // using variant id as value
          }));

          setWeightItems(variantItems);

          // default variant (first one)
          const variant0 = allVariants.length ? allVariants[0] : null;
          const price = variant0?.price || first.main_price || '0';
          const unit = variant0?.unit || '';
          const normalized = { ...first, images: allImages, price, unit };

          setProductData(normalized);
          setDisplayPrice(price);
          setDisplayUnit(unit);

          console.log('product', productData)

          if (variant0) {
            setSelectedVariant(variant0);
            setWeightValue(variant0.id);
          }
        } else {
          setProductData(null);
        }
      }
    } catch (err) {
      console.log('Product fetch error:', err);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const ShowReview = async () => {
    try {
      showLoader();
      const res = await UserService.Reviewlist(proDuctID);
      hideLoader();

      if (res?.status === HttpStatusCode.Ok && res?.data) {
        const { data } = res.data;
        setReviews(data || []);
        // console.log("review data", res?.data?.data[0]?.customer)
      } else {
        Toast.show({
          type: 'error',
          text1: res?.data?.message || 'Something went wrong!',
        });
      }
    } catch (err: any) {
      hideLoader();
      console.log('Error in ShowReview:', JSON.stringify(err));
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || 'Something went wrong! Please try again.',
      });
    }
  };

  useEffect(() => {
    GetProducts();
    ShowReview();
  }, []);

  const PostReview = async () => {
    try {
      const payload = {
        rating: newRating,
        review: newComment || 'No comment',

      };

      showLoader();
      await UserService.Review(payload, proDuctID)
        .then(async res => {
          hideLoader();
          if (res && res?.data && res?.status === HttpStatusCode.Ok) {
            Toast.show({
              type: 'success',
              text1: res?.data?.message,
            });
            console.log("Review", res.data)
            Toast.show({ type: 'success', text1: res?.data?.message });
            // setReviews(prev => [r, ...prev]);
            setNewComment('');
            setNewRating(5);
            setWriteModalVisible(false);
            // navigation.goBack();
          } else {
            Toast.show({
              type: 'error',
              text1: 'Something went wrong!',
            });
          }
        })
        .catch(err => {
          hideLoader();
          console.log('Error in Review:', err);
          Toast.show({
            type: 'error',
            text1: err.response?.data?.message,
          });
        });
    } catch (error) {
      hideLoader();
      Toast.show({
        type: 'error',
        text1: 'Something went wrong! Please try again.',
      });
    }
  };

  const products = new Array(6).fill(0).map((_, i) => ({
    id: String(i + 1),
    title: `Magic Queen Oolong ${i + 1}`,
    price: '24 €',
    stock: i === 2 ? 0 : 10, // 👈 Example: product 3 is out of stock
    image: require('../../assets/Png/product.png'),
  }));
  const videoSource = require('../../assets/Png/splash.mp4');
  const productImage = require('../../assets/Png/product3.png');
  // derive carousel images from fetched productData; if none, leave empty so we can show a neutral placeholder
  const productImages: any[] =
    productData?.images && productData.images.length ? productData.images : [];

  // helper to convert string URLs into image sources
  const resolveImageSource = (img: any) =>
    typeof img === 'string' ? { uri: img } : img;
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const increaseQty = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const decreaseQty = (id: string) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id] > 1) {
        updated[id] -= 1;
      } else {
        delete updated[id];
      }
      return updated;
    });
  };
  // Reviews modal state
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [showModalVisible, setShowModalVisible] = useState(false);
  const [reviews, setReviews] = useState<Array<any>>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [newQty, setNewQty] = useState<number>(0);
  // description expand/collapse
  const [descExpanded, setDescExpanded] = useState<boolean>(false);
  // weight dropdown state
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightValue, setWeightValue] = useState('0');
  const [weightItems, setWeightItems] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  // when productData changes, populate weightItems from variants
  useEffect(() => {
    if (productData && Array.isArray(productData.variants)) {
      const items = productData.variants.map((v: any, i: number) => ({
        label: v.unit || v.weight || `Option ${i + 1}`,
        value: String(i),
        price: v.price,
        unit: v.unit,
      }));
      setWeightItems(items);
      setVariants(productData.variants);
      if (items.length) {
        setWeightValue('0');
        setDisplayPrice(items[0].price ?? productData.price ?? '0');
        setDisplayUnit(items[0].unit ?? productData.unit ?? '');
      }
    }
  }, [productData]);
  // carousel state
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const animOpacity = useRef(new Animated.Value(1)).current;
  const autoplayRef = useRef<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const { showLoader, hideLoader } = CommonLoader();
  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isInteracting]);

  // reset active index when product images change
  useEffect(() => {
    setActiveIndex(0);
    stopAutoplay();
    startAutoplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productImages.length]);


  const AddToCart = async (item: any) => {
    console.log("addtocart", selectedVariant?.id)
    try {
      const payload = {
        product_id: item?.id,
        variant_id: selectedVariant?.id || null,
        quantity: 1,
      };
      console.log('AddToCart payload:', payload);
      showLoader();
      const res = await UserService.AddToCart(payload);
      hideLoader();

      if (res && res.data && res.status === HttpStatusCode.Ok) {
        GetProducts()
        Toast.show({
          type: 'success',
          text1: res.data?.message || 'Added to cart!',
        });

        // Update local cart state

      } else {
        Toast.show({ type: 'error', text1: 'Failed to add to cart' });
      }
    } catch (err: any) {
      hideLoader();
      Toast.show({
        type: 'error',
        text1:
          err?.response?.data?.message ||
          'Something went wrong! Please try again.',
      });
    }
  };

  const startAutoplay = () => {
    if (autoplayRef.current != null) return;
    if (isInteracting) return;
    // do not start autoplay if there's 0 or 1 image
    if (!productImages || productImages.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      const next = (activeIndex + 1) % productImages.length;
      animateToIndex(next);
    }, 3000) as unknown as number;
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current as any);
      autoplayRef.current = null;
    }
  };

  const animateToIndex = (nextIndex: number) => {
    // fade out
    Animated.timing(animOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: false });
      setActiveIndex(nextIndex);
      // fade in
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  // zoom modal state
  const [zoomVisible, setZoomVisible] = useState<boolean>(false);
  const [zoomIndex, setZoomIndex] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const openZoom = (index: number) => {
    setZoomIndex(index);
    setZoomScale(1);
    setZoomVisible(true);
  };

  const closeZoom = () => {
    setZoomVisible(false);
    setZoomScale(1);
  };

  const increaseZoom = () =>
    setZoomScale(s => Math.min(4, +(s + 0.5).toFixed(2)));
  const decreaseZoom = () =>
    setZoomScale(s => Math.max(1, +(s - 0.5).toFixed(2)));

  const submitReview = () => {
    const r = {
      id: `r${Date.now()}`,
      rating: newRating,
      author: 'You',
      comment: newComment || 'No comment',
      date: new Date().toISOString().slice(0, 10),
    };

  };

  const renderProduct = ({ item }: { item: any }) => {
    const qty = cart[item.id] || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
        activeOpacity={0.8}
      >
        <Image source={item.image} style={styles.cardImage} />
        <View style={styles.cardBody}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.title}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map(r => (
              <View key={r} style={{}}>
                <Text style={{ color: '#F0C419', fontSize: 24 }}>★</Text>
              </View>
            ))}
          </View>
          <Text style={styles.cardPrice}>{item.price}</Text>

          {item.stock === 0 ? (
            <Text style={styles.outOfStock}>Out of Stock</Text>
          ) : qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => increaseQty(item.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => decreaseQty(item.id)}
              >
                <Text style={styles.qtyText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => increaseQty(item.id)}
              >
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return isLoadingProduct ? (
    <SkeletonPlaceholderFull />
  ) : (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerRightVideo}>

          <TouchableOpacity
            onPress={() => toggleWishlist(productData.id)}
            activeOpacity={0.7}
            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E689', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 10, right: 10 }}
          >
            {productData?.is_wishlist ? <Image
              source={require('../../assets/Png/heart1.png')}
              style={{ position: 'absolute', width: 15, height: 15, alignSelf: 'center' }}
            /> :
              <Video
                source={videoSource}
                style={styles.sideVideoInner}
                repeat
                muted
                resizeMode="cover"
              />}
          </TouchableOpacity>
        </View>
      </View>
      {/* Image carousel with dots. Tap an image to open zoom modal */}
      <View>
        <FlatList
          ref={r => {
            flatListRef.current = r;
          }}
          data={productImages}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(idx);
          }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openZoom(index)}
              style={{ width }}
              onPressIn={() => {
                setIsInteracting(true);
                stopAutoplay();
              }}
              onPressOut={() => {
                setIsInteracting(false);
                stopAutoplay();
                startAutoplay();
              }}
            >
              {/* Animated fade for image change */}
              <Animated.View style={{ opacity: animOpacity }}>
                <Image
                  source={resolveImageSource(item)}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </Animated.View>
            </TouchableOpacity>
          )}
        />
        {productImages && productImages.length ? (
          <View style={styles.dotsRow}>
            {productImages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : undefined,
                ]}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              width,
              height: HERO_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f6f6f6',
            }}
          >
            <Text style={{ color: '#999' }}>No images available</Text>
          </View>
        )}
      </View>

      {/* Zoom modal (built-in) */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <View style={styles.zoomModalBg}>
          <View style={styles.zoomHeader}>
            <TouchableOpacity onPress={closeZoom} style={styles.zoomClose}>
              <Text style={{ color: '#fff', fontSize: 18 }}>Close</Text>
            </TouchableOpacity>
            <View style={styles.zoomControls}>
              <TouchableOpacity
                onPress={decreaseZoom}
                style={styles.zoomControlBtn}
              >
                <Text style={{ color: '#fff', fontSize: 20 }}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={increaseZoom}
                style={[styles.zoomControlBtn, { marginLeft: 8 }]}
              >
                <Text style={{ color: '#fff', fontSize: 20 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
          >
            {productImages && productImages.length ? (
              <Image
                source={resolveImageSource(productImages[zoomIndex])}
                style={[
                  styles.zoomImage,
                  { transform: [{ scale: zoomScale }] },
                ]}
                resizeMode="contain"
              />
            ) : (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>No Image</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: 16 }}
      >
        <Text style={styles.title}>
          {productData.name != null ? productData.name : ''}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{displayPrice}€ </Text>
          <View style={{ width: 12 }} />
          <View style={styles.dropdownWrapper}>
            <DropDownPicker
              open={weightOpen}
              value={weightValue}
              items={weightItems}
              setOpen={setWeightOpen}
              setValue={setWeightValue}
              setItems={setWeightItems}
              onChangeValue={(val: any) => {
                // val is the index (string) of selected variant
                const idx = Number(val);
                const v = variants[idx];
                if (v) {
                  setDisplayPrice(v.price ?? productData.price ?? displayPrice);
                  setDisplayUnit(v.unit ?? productData.unit ?? displayUnit);
                  setSelectedVariant(v);
                }
              }}

              containerStyle={{ height: 40 }}
              style={{
                backgroundColor: '#FFF',
                borderRadius: 20,
                // width: '45%',
                alignItems: 'center',
                borderWidth: 1,
                height: 30,
                borderColor: '#fff',
              }}
              dropDownContainerStyle={{ backgroundColor: '#fff' }}
            />
          </View>
        </View>

        <View style={styles.headerRight}>
          {productData.stock_quantity === 0 ? (
            <Text style={styles.outOfStock}>Out of Stock</Text>
          ) : (
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => { productData?.is_cart === "true" ? navigation.navigate('CheckoutScreen') : AddToCart(productData) }}
              activeOpacity={0.8}
            >
              <Text style={styles.filterText}>{productData?.is_cart === "true" ? 'Go to Cart' : 'Add to Bag'}</Text>
            </TouchableOpacity>
          )}
          {/* <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => navigation.navigate('CheckoutScreen')}
          >
            <Text style={styles.sortText}>Check-Out</Text>
          </TouchableOpacity> */}
        </View>
        <Text style={{ marginTop: 12, color: '#666' }}>
          Product Description
        </Text>
        <Text
          style={{ marginTop: 8, lineHeight: 20, color: '#333' }}
          numberOfLines={descExpanded ? undefined : 3}
        >
          {productData.description != null ? productData.description : ''}
        </Text>
        <TouchableOpacity
          onPress={() => setDescExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <Text style={{ marginTop: 8, color: '#FFC107', fontWeight: '700' }}>
            {descExpanded ? 'Read less' : 'Read more'}
          </Text>
        </TouchableOpacity>

        {/* recommended row placeholder */}
        <Text style={{ marginTop: 20, fontWeight: '700', bottom: 10 }}>
          Recommended For You
        </Text>
        <FlatList
          data={products}
          keyExtractor={i => i.id}
          renderItem={renderProduct}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        //   style={{ width: '100%' }}
        //   numColumns={2}
        //   columnWrapperStyle={styles.row}
        //   scrollEnabled={false}
        />

        {/* Customer Reviews Section */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>Customer Reviews</Text>

          <View style={styles.reviewsRow}>
            <View style={styles.reviewsLeft}>
              <Text style={styles.reviewsScore}>5</Text>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                {new Array(5).fill(0).map((_, i) => (
                  <Text key={i} style={styles.star}>
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.reviewsCount}>3 Reviews</Text>
            </View>

            <View style={styles.reviewsRight}>
              {[5, 4, 3, 2, 1].map(star => {
                const percent =
                  star === 5
                    ? 0.95
                    : star === 4
                      ? 0.6
                      : star === 3
                        ? 0.2
                        : star === 2
                          ? 0.12
                          : 0.05;
                return (
                  <View key={star} style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>{star}</Text>
                    <View style={styles.ratingBarBg}>
                      <View
                        style={[
                          styles.ratingBarFill,
                          { width: `${percent * 100}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.reviewsButtons}>
            <TouchableOpacity
              style={styles.writeBtn}
              onPress={() => setWriteModalVisible(true)}
            >
              <Text style={styles.writeBtnText}>Write A Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.showBtn}
              onPress={() => setShowModalVisible(true)}
            >
              <Text style={styles.showBtnText}>Show Review</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Write Review Modal */}
        <Modal visible={writeModalVisible} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <View
              style={{
                backgroundColor: '#fff',
                padding: 16,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700' }}>
                Write a Review
              </Text>
              <Text style={{ marginTop: 8 }}>Rating</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setNewRating(r)}
                    style={{ marginRight: 8 }}
                  >
                    <Text
                      style={{
                        color: newRating >= r ? '#F0C419' : '#ccc',
                        fontSize: 24,
                      }}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write your review"
                style={{
                  borderWidth: 1,
                  borderColor: '#eee',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 12,
                }}
                multiline
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setWriteModalVisible(false)}
                  style={{ marginRight: 8 }}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={PostReview}>
                  <Text style={{ color: '#007AFF' }}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Show Reviews Modal */}
        <Modal visible={showModalVisible} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <View
              style={{
                backgroundColor: '#fff',
                padding: 16,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                maxHeight: '70%',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Reviews</Text>
              <ScrollView style={{ marginTop: 12 }}>
                {reviews.map(r => (
                  <View
                    key={r.id}
                    style={{
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: '#eee',
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", flex: 1, }}>
                      <Text style={{ fontWeight: '700' }}>
                        {r.customer?.name}{' '}
                      </Text>
                      <Text style={{ fontWeight: '400', }}>{formatDate(r.updated_at)}</Text>

                    </View>
                    <Text style={{ color: '#F0C419' }}>
                      {'★'.repeat(r.rating)}
                    </Text>
                    <Text style={{ marginTop: 4 }}>{r.review}</Text>
                  </View>
                ))}
              </ScrollView>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginTop: 12,
                }}
              >
                <TouchableOpacity onPress={() => setShowModalVisible(false)}>
                  <Text style={{ color: '#007AFF' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: {
    width: width,
    height: HERO_HEIGHT,
    justifyContent: 'flex-start',
    marginTop: '5%',
  },
  heroImage: {
    width: width,
    height: HERO_HEIGHT,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 10,
  },
  sideVideoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sideVideo: { width: '100%', height: '100%' },
  sideVideoInner: { width: '100%', height: '100%', },
  playOverlay: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  backText: { fontSize: 18 },
  headerRightVideo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  price: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  actionsRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },

  checkoutBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 20,
  },
  card: {
    paddingHorizontal: 8,
  },
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
  addBtn: {
    marginTop: 10,
    backgroundColor: '#2DA3C7',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
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
  qtyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  qtyCount: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
    color: '#000',
  },
  outOfStock: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: 'red',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  filterBtn: {
    marginRight: 8,
    padding: 8,
    backgroundColor: '#E2E689',
    borderRadius: 20,
    width: '45%',
    alignItems: 'center',
  },
  filterText: { color: Colors.text[300] },
  sortBtn: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  sortText: { color: Colors.text[300] },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  dropdownWrapper: { width: 140 },
  reviewsSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  reviewsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  reviewsRow: { flexDirection: 'row' },
  reviewsLeft: { width: 100, alignItems: 'center' },
  reviewsScore: { fontSize: 32, fontWeight: '800' },
  star: { color: '#F0C419', marginRight: 4 },
  reviewsCount: { color: '#666', marginTop: 8 },
  reviewsRight: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratingLabel: { width: 18 },
  ratingBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginLeft: 8,
  },
  ratingBarFill: { height: 8, backgroundColor: '#F0C419', borderRadius: 6 },
  reviewsButtons: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  writeBtn: {
    backgroundColor: '#E2E689',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  writeBtnText: { fontWeight: '700' },
  showBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  showBtnText: {},
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#fff' },
  zoomModalBg: { flex: 1, backgroundColor: '#000' },
  zoomHeader: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
    marginTop: '5%',
  },
  zoomClose: { padding: 8, marginTop: '5%' },
  zoomControls: { flexDirection: 'row', alignItems: 'center', marginTop: '5%' },
  zoomControlBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  zoomImage: { width: width, height: height - 100 },
  // skeleton placeholder styles
  skelContainer: { flex: 1, backgroundColor: '#fff' },
  skelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  skelRectSmall: {
    width: 120,
    height: 14,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  skelHero: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: '#eee',
    marginTop: 12,
  },
  skelTitle: {
    width: '70%',
    height: 20,
    backgroundColor: '#eee',
    marginTop: 12,
    borderRadius: 6,
  },
  skelTitleShort: {
    width: '40%',
    height: 16,
    backgroundColor: '#eee',
    marginTop: 8,
    borderRadius: 6,
  },
  skelPrice: {
    width: 100,
    height: 28,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  skelDropdown: {
    width: 120,
    height: 36,
    backgroundColor: '#eee',
    borderRadius: 18,
  },
  skelDescLine: {
    width: '100%',
    height: 12,
    backgroundColor: '#eee',
    marginTop: 8,
    borderRadius: 6,
  },
  skelDescLineShort: {
    width: '70%',
    height: 12,
    backgroundColor: '#eee',
    marginTop: 6,
    borderRadius: 6,
  },
  skelSectionTitle: {
    width: 140,
    height: 18,
    backgroundColor: '#eee',
    borderRadius: 6,
  },
  skelCard: { width: 140, marginRight: 12 },
  skelCardImage: {
    width: 140,
    height: 110,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  skelCardTitle: {
    width: '80%',
    height: 12,
    backgroundColor: '#eee',
    marginTop: 8,
    borderRadius: 6,
  },
});
