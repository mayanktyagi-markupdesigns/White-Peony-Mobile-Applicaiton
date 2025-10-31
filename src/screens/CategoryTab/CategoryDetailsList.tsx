import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Modal, Dimensions, Animated } from 'react-native';
import { useCart } from '../../context/CartContext'; // adjust import path if needed
import { Image_url, UserService } from '../../service/ApiService'; // replace with your actual functions
import { heightPercentageToDP, widthPercentageToDP } from '../../constant/dimentions';
import { Colors } from '../../constant';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

const sampleData = new Array(8).fill(null).map((_, i) => ({
  id: String(i + 1),
  title: `Maple Queen Oolong`,
  price: '24 €',
  image: require('../../assets/Png/banner.png'),
}));

const CategoryDetailsList = ({ navigation, route }: any) => {
  const { addToCart, removeFromCart, isLoggedIn, cart } = useCart();
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { categoryId, categoryTitle, mode } = route.params || {};
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  const ProductImageCarousel = ({ images, width }: { images: any[], width?: number }) => {
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
          <Image source={source} style={[styles.cardImage, width ? { width } : {}]} />
        ) : (
          <View style={[styles.cardImage, width ? { width } : {}, { backgroundColor: '#eee' }]} />
        )}
      </Animated.View>
    );
  };


  // 🧩 Fetch products based on mode
  const fetchProducts = async () => {
    console.log(mode)
    setLoading(true);
    try {
      let response: any = [];
      if (mode === 'recommended') response = await UserService.recommended();
      else if (mode === 'Best Sale') response = await UserService.mostsellingproduct();
      else if (mode === 'all') response = await UserService.product();
      else if (categoryId) response = await UserService.GetCategoryByID(categoryId);

      // normalize possible response shapes: some endpoints return { data: [...] } and
      // others return { data: { data: [...] } } or similar. Try both.
      const payload = response?.data?.data ?? response?.data ?? response ?? [];
      //console.log('Fetched products payload:', response);
      const productsArray = Array.isArray(payload) ? payload : (payload?.data ?? []);

      if (productsArray && productsArray.length) {
        const cartIds = new Set(cart.map((c: any) => String(c.id || c.product_id)));
        const updatedProducts = productsArray.map((p: any) => ({
          ...p,
          is_cart: cartIds.has(String(p.id)) ? 'true' : 'false',
        }));
        setApiProducts(updatedProducts);
        console.log("upadteddd", updatedProducts)
      } else {
        console.log('No products found in the response.', response);
        setApiProducts([]);
      }
    } catch (err) {
      console.log('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Fetch products initially (once when page loads)
  useEffect(() => {
    fetchProducts();
  }, [categoryId, mode]);

  // 🔁 Recalculate `is_cart` whenever cart changes (no refetch needed)
  useEffect(() => {
    if (apiProducts.length) {
      const cartIds = new Set(cart.map((c: any) => String(c.id || c.product_id)));
      setApiProducts((prev) =>
        prev.map((p) => ({
          ...p,
          is_cart: cartIds.has(String(p.id)) ? 'true' : 'false',
        }))
      );
    }
  }, [cart]);

  const handleAddToCart = async (item: any) => {
    // CartContext.addToCart expects (productId, selectedVariant?)
    const productId = item?.id ?? item?.product_id;
    const variantId = item?.variants?.[0]?.id ?? item?.variant_id ?? null;
    if (!productId) {
      console.log('handleAddToCart: missing product id', item);
      return;
    }
    try {
      await addToCart(Number(productId), variantId);
      // no optimistic update here; cart effect will re-run and update is_cart
    } catch (e) {
      console.log('addToCart failed', e);
    }
  };


  const renderItem = ({ item }: { item: any }) => {

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
          width={ITEM_WIDTH}
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
            {item?.variants[0]?.price}€ {item?.variants[0]?.weight ? `- ${item?.variants[0]?.weight}` : item?.variants[0]?.unit ? `- ${item?.variants[0]?.unit}` : ''}
          </Text>

          {item.stock_quantity === 0 ? (
            <Text style={styles.outOfStock}>Out of Stock</Text>
          ) : (
            <TouchableOpacity
              onPress={() => (item.is_cart === 'true' ? console.log('Navigate to Cart') : handleAddToCart(item))}
              style={styles.filterBtn}
            >
              <Text style={styles.filterText}>
                {item.is_cart === 'true' ? 'Go to Cart' : 'Add to Bag'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

    );
  };


  return (
    <LinearGradient colors={['#F3F3F3', '#FFFFFF']}
      style={styles.container}> <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} >
          <Image source={require('../../assets/Png/back.png')} style={{ width: 20, height: 20 }} />
        </TouchableOpacity> <Text style={styles.headerTitle}>{categoryTitle}</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('CheckoutScreen')}>
          <Image source={require('../../assets/Png/order.png')} style={styles.icon} />
        </TouchableOpacity> </View> <View style={styles.headerRight}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)} >
          <Text style={styles.filterText}>Filters ▾</Text> </TouchableOpacity>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortVisible(true)} >
          <Text style={styles.sortText}>Sort ▾</Text> </TouchableOpacity> </View>

      <FlatList data={apiProducts}
        keyExtractor={i => i.id} numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={() => {
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', marginTop: heightPercentageToDP(40) }}>
              <Text style={{ fontSize: 14, fontWeight: '700' }}>No Data Found</Text>
            </View>)
        }}
        columnWrapperStyle={{ justifyContent: 'space-between' }} /> {/* Filter Modal */}

      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>
            <Text style={styles.modalNote}> (Add your filter controls here) </Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setFilterVisible(false)} >
              <Text style={styles.modalCloseText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> {/* Sort Modal */}

      <Modal visible={sortVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort</Text>
            <TouchableOpacity style={styles.sortOption}> <Text>Popular</Text> </TouchableOpacity>
            <TouchableOpacity style={styles.sortOption}> <Text>Price: Low to High</Text> </TouchableOpacity>
            <TouchableOpacity style={styles.sortOption}> <Text>Price: High to Low</Text> </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSortVisible(false)} >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>);
};

//   return (
//     <View style={{ flex: 1, backgroundColor: '#fff' }}>
//       {loading ? (
//         <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
//       ) : apiProducts.length > 0 ? (
//         <FlatList
//           data={apiProducts}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderItem}
//         />
//       ) : (
//         <Text style={{ textAlign: 'center', marginTop: 20 }}>No Products Found</Text>
//       )}
//     </View>
//   );
// };

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
    marginRight: '20%'
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', width: '90%', alignSelf: 'center', justifyContent: 'space-around' },
  filterBtn: {
    padding: 8,
    backgroundColor: '#AEB254',
    borderRadius: 20,
    marginVertical: 10,
    width: widthPercentageToDP(30),
    alignItems: 'center'
  },
  filterText: { color: Colors.text[100] },
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
    width: widthPercentageToDP(45),
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

  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E689',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,

    marginTop: 16,
  },
  cartButtonActive: {
    backgroundColor: '#2DA3C7',
  },
  cartButtonDisabled: {
    opacity: 0.7,
  },
  cartButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginRight: 8,
  },

});
