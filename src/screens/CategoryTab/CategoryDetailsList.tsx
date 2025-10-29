import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import Colors from '../../constant/colors';
import Images from '../../constant/images';
import LinearGradient from 'react-native-linear-gradient';
import { UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import Toast from 'react-native-toast-message';
import { heightPercentageToDP, widthPercentageToDP } from '../../constant/dimentions';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

const sampleData = new Array(8).fill(null).map((_, i) => ({
  id: String(i + 1),
  title: `Maple Queen Oolong`,
  price: '24 €',
  image: require('../../assets/Png/banner.png'),
}));

const CategoryDetailsList = ({ navigation, route }: any) => {
  const { addToCart, removeFromCart, getCartDetails, syncCartAfterLogin } = useCart();
  const { categoryId, categoryTitle } = route.params;
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const { showLoader, hideLoader } = CommonLoader();
  const [apiProducts, setApiProducts] = useState<any[]>([]);
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

  const renderProduct = ({ item }: { item: any }) => {
    //console.log("cartitem", item)
    //  const qty = cart[item.id] || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ProductDetails', { productId: item.id })
        }
        activeOpacity={0.8}
      >
        <ProductImageCarousel
          images={item.images || [require('../../assets/Png/product.png')]}
        />
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
                  await GetCateProducts(categoryId);
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
              <Text style={styles.filterText}>{item?.is_cart === "true" ? 'Go to Cart' : 'Add to Bag'}</Text>
            </TouchableOpacity>

          )}
        </View>
      </TouchableOpacity>
    );
  };
  useEffect(() => {
    if (categoryId) {
      GetCateProducts(categoryId);
    }
  }, [categoryId]);
  const GetCateProducts = async (categoryId: string) => {
    try {
      showLoader();
      const res = await UserService.GetCategoryByID(categoryId);
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        hideLoader();
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
        hideLoader();
        // handle non-OK response if needed
      }
    } catch (err) {
      hideLoader()
      // handle network/error
    } finally {
      setIsLoadingProduct(false);
    }
  };
  return (
    <LinearGradient colors={['#F3F3F3', '#FFFFFF']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryTitle}</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Image source={require('../../assets/Png/order.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={styles.filterText}>Filters ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortVisible(true)}
        >
          <Text style={styles.sortText}>Sort ▾</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={apiProducts}
        keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={renderProduct}
        ListEmptyComponent={() => {
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', marginTop: heightPercentageToDP(40) }}>
              <Text style={{ fontSize: 14, fontWeight: '700' }}>No Data Found</Text>
            </View>

          )
        }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />


      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>
            <Text style={styles.modalNote}>
              (Add your filter controls here)
            </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.modalCloseText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={sortVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort</Text>
            <TouchableOpacity style={styles.sortOption}>
              <Text>Popular</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortOption}>
              <Text>Price: Low to High</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortOption}>
              <Text>Price: High to Low</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSortVisible(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default CategoryDetailsList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  outOfStock: { marginTop: 10, fontSize: 14, fontWeight: '600', color: 'red' },
  iconBtn: {
    position: 'absolute',
    right: 20,

  }, addBtn: {
    marginTop: 10,
    backgroundColor: '#2DA3C7',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  icon: { width: 20, height: 20, tintColor: undefined },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    marginTop: 30,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginRight: '40%'
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', width: '90%', alignSelf: 'center', justifyContent: 'space-around' },
  filterBtn: {
    marginRight: 8,
    padding: 8,
    backgroundColor: '#AEB254',
    borderRadius: 20,
    width: '45%',
    alignItems: 'center'
  },
  filterText: { color: Colors.text[300] },
  sortBtn: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',

  },
  sortText: { color: Colors.text[300] },

  list: {
    marginHorizontal: 10,
    paddingBottom: 24,
  },
  card: {
    width: widthPercentageToDP(30)
    // paddingHorizontal: 8,
  },
  CategoryView: {
    width: 'auto',
    height: 32,
    // backgroundColor: '#E2E689',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    paddingHorizontal: 10,
    margin: 5,

  },
  cardImage: { width: 177, height: 245, borderRadius: 9, borderWidth: 1, borderColor: '#D9D9D9' },
  cardBody: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '600' },
  cardPrice: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0b3b2e',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalNote: { color: '#666', marginBottom: 12 },
  modalClose: { marginTop: 12, alignSelf: 'flex-end', padding: 10 },
  modalCloseText: { color: Colors.button[300], fontWeight: '600' },
  sortOption: { paddingVertical: 12 },
});
