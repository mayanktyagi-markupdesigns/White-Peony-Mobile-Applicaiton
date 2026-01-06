import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import LoginModal from '../../components/LoginModal';
import { Image_url, UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import Toast from 'react-native-toast-message';
import AddressModal from '../../components/AddressModal';
import { useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP } from '../../constant/dimentions';
import { useCart } from '../../context/CartContext';
import { WebView } from 'react-native-webview';
import { Images } from '../../constant';


const SCREEN_WIDTH = Dimensions.get('window').width;

type DisplayWishlistItem = {
  id: string; // product id
  wishlistItemId: string;
  name: string;
  price: string;
  image: string | null;
  unit?: string;
};

type CartItem = {
  id?: string;
  product_id: number | string;
  front_image?: string;
  product_name?: string;
  variant_sku?: string;
  total_price?: number;
  quantity: number;
  variants?: { variant_id?: number | string }[];
};

type Address = {
  id: string | number;
  address_type?: string;
  name?: string;
  full_address?: string;
  phone?: string;
  postal_code?: string | number;
  city?: string;
  email?: string;
};

const CheckoutScreen = ({ navigation }: { navigation: any }) => {
  const { addToCart, removeFromCart, getCartDetails, syncCartAfterLogin } = useCart();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAddress, setModalAddress] = useState(false);
  const [modalAddressADD, setmodalAddressADD] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [items, setItems] = useState<DisplayWishlistItem[]>([]);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');


  const { showLoader, hideLoader } = CommonLoader();
  const [cartData, setApiCartData] = useState<CartItem[]>([]);
  const [cartid, setcartid] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);
  const [isFetchingShipping, setIsFetchingShipping] = useState(false);

  const [promoOptions, setPromoOptions] = useState<any[]>([]);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState({ code: '', type: '', discount: '' });
  const [isFetchingPromo, setIsFetchingPromo] = useState(false);

  ///coupans code 
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        showLoader();
        const res = await UserService.wishlist();
        const apiWishlist = res?.data?.items || [];

        setItems(apiWishlist);
        //console.log('Wishlist fetched:', apiWishlist[0]?.variants);
      } catch (e) {
        hideLoader();
        const error = e as any;
        if (error.status === 401) {
          console.log('Unauthorized access - perhaps token expired');
        }
        else {
          Toast.show({ type: 'error', text1: 'Failed to load wishlist' });
        }
      } finally {
        hideLoader();
      }
    };
    fetchWishlist();
    // initial fetch shipping (optional)
    Getshiping();
    //GetPromo()
  }, []);

  const moveToWishlist = (itemId: string | number | undefined) => {
    Alert.alert('Moved to wishlist', `Item ID: ${itemId}`);
  };

  const UpdateCart = async (item: CartItem, change: number) => {
    console.log('UpdateCart called with item:', item, 'change:', change);
    showLoader();
    try {
      const currentQty = Number(item.quantity);
      const newQty = currentQty + change;

      if (newQty < 1) return Toast.show({ type: 'info', text1: 'Minimum quantity is 1' });
      if (newQty > 99) return Toast.show({ type: 'info', text1: 'Maximum quantity is 99' });

      const payload = {
        product_id: item.product_id,
        quantity: newQty,
        variant_id: item.variant_id ?? null,
      };

      const res = await UserService.UpdateCart(payload);
      hideLoader();
      if (res?.data?.success === true) {
        Toast.show({
          type: 'success',
          text1: res.data?.message || 'Cart updated!',
        });
        console.log('UpdateCart response:', res?.data);
        GetCartDetails();
      } else {
        console.log('errcheckout', res?.data);
        Toast.show({ type: 'error', text1: 'Failed to update cart' });
      }
    } catch (err: any) {
      console.log('errcheckout', JSON.stringify(err));
      hideLoader();
      Toast.show({
        type: 'error',
        text1:
          err?.response?.data?.message ||
          'Something went wrong! Please try again.',
      });
    }
  };

  const renderShipmentItem = ({ item }: { item: CartItem }) => (
    <View style={styles.shipmentItemCard}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 6, right: 6 }}
        onPress={async () => {
          try {
            showLoader();
            // await removal from cart (handles both guest/local and server flows)
            await removeFromCart(Number(item.product_id));
            // refresh cart after successful removal
            await GetCartDetails();
          } catch (err) {
            console.log('removeFromCart error', err);
            Toast.show({ type: 'error', text1: 'Failed to remove item' });
          } finally {
            hideLoader();
          }
        }}
      >
        <Image
          source={require('../../assets/Png/delete.png')}
          style={{ width: 30, height: 30 }}
        />
      </TouchableOpacity>
      <Image
        source={{ uri: Image_url + item.front_image }}
        style={styles.shipmentImage}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.shipmentName}>{item.name}</Text>
        <Text style={styles.shipmentWeight}>{item?.unit || null} </Text>
        <TouchableOpacity
          onPress={() => moveToWishlist(item.id)}
          style={styles.moveToWishlistBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.moveToWishlistText}>Move to wishlist</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', marginVertical: 5 }}>
          {[1, 2, 3, 4, 5].map((r) => {
            const isFull = item?.average_rating >= r;
            const isHalf = item?.average_rating >= r - 0.5 && item?.average_rating < r;
            return (
              <View key={r} style={{ width: 18, height: 18, position: 'relative' }}>
                {/* base gray star */}
                <Text style={{ color: '#ccc', fontSize: 18, position: 'absolute' }}>★</Text>
                {/* overlay half or full star */}
                <View
                  style={{
                    width: isFull ? '100%' : isHalf ? '50%' : '0%',
                    overflow: 'hidden',
                    position: 'absolute',
                  }}
                >
                  <Text style={{ color: '#F0C419', fontSize: 18 }}>★</Text>
                </View>
              </View>
            )
          })}
        </View>
        <Text style={styles.shipmentPrice}>{item?.total_price} €</Text>

        <View style={styles.qtyControlContainer}>
          <TouchableOpacity
            onPress={() => UpdateCart(item, -1)}
            style={styles.qtyBtn}
            activeOpacity={0.7}
            disabled={item.quantity <= 1}
          >
            <Image
              source={require('../../assets/Png/minus.png')}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>

          <Text style={styles.qtyText}>{item.quantity}</Text>

          <TouchableOpacity
            onPress={() => UpdateCart(item, +1)}
            style={styles.qtyBtn}
            activeOpacity={0.7}>
            <Image
              source={require('../../assets/Png/add.png')}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );

  const renderSuggestionItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() =>
      navigation.navigate('ProductDetails', { productId: item.product_id })
    }
      activeOpacity={0.8}>
      <View style={styles.suggestionCard} >
        <Image source={require('../../assets/Png/product.png')} style={styles.suggestionImage} />
        <Text style={styles.suggestionName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map((r) => {
            const isFull = item?.average_rating >= r;
            const isHalf = item?.average_rating >= r - 0.5 && item?.average_rating < r;
            return (
              <View key={r} style={{ width: 18, height: 18, position: 'relative' }}>
                {/* base gray star */}
                <Text style={{ color: '#ccc', fontSize: 18, position: 'absolute' }}>★</Text>
                {/* overlay half or full star */}
                <View
                  style={{
                    width: isFull ? '100%' : isHalf ? '50%' : '0%',
                    overflow: 'hidden',
                    position: 'absolute',
                  }}
                >
                  <Text style={{ color: '#F0C419', fontSize: 18 }}>★</Text>
                </View>
              </View>
            )
          })}
        </View>
        <Text style={styles.suggestionPrice}>{item?.variants[0]?.unit}</Text>
        <Text style={[styles.suggestionPrice, { color: '#000' }]}>{item?.variants[0]?.price} €</Text>
      </View>
    </TouchableOpacity>
  );

  const SetPromo = async () => {
    if (!selectedPromoCode?.code) {
      Toast.show({ type: 'info', text1: 'Please select a coupon first.' });
      return;
    }

    try {
      setIsApplyingPromo(true);

      // ✅ Find promo by code
      const selectedPromo = promoOptions.find(
        (p) =>
          String(p.code ?? p.promo_code ?? p.promo ?? p.title) ===
          String(selectedPromoCode.code)
      );

      if (!selectedPromo) {
        Toast.show({ type: 'error', text1: 'Invalid coupon selected.' });
        return;
      }

      const total = Number(cartData?.total_amount ?? 0);
      const discountType = selectedPromo.discount_type?.toLowerCase();
      const discountValue = parseFloat(selectedPromoCode.code.replace(/[^\d.]/g, '')) || 0;
      const maxDiscount = Number(selectedPromo.max_discount ?? 0);

      console.log('Applying promo:', total, discountType, discountValue, maxDiscount);

      let calculatedDiscount = 0;

      if (discountType === 'percentage') {
        calculatedDiscount = (total * discountValue) / 100;
        if (maxDiscount > 0 && calculatedDiscount > maxDiscount)
          calculatedDiscount = maxDiscount;
      } else {
        calculatedDiscount = discountValue;
      }

      if (calculatedDiscount > total) calculatedDiscount = total;

      setDiscountAmount(Number(calculatedDiscount.toFixed(0)));
      setAppliedPromo(selectedPromo);
      setPromoModalVisible(false);

      Toast.show({
        type: 'success',
        text1: `Coupon applied! You saved ${calculatedDiscount.toFixed(0)}`,
      });
    } catch (err) {
      console.log('SetPromo error', err);
      Toast.show({ type: 'error', text1: 'Failed to apply coupon' });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removeCoupon = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    Toast.show({ type: 'info', text1: 'Coupon removed.' });
  };

  useFocusEffect(
    React.useCallback(() => {
      GetCartDetails();
      return () => {
        //console.log('Screen is unfocused!');
      };
    }, [])
  );

  const GetCartDetails = async () => {
    try {
      setIsLoadingProduct(true);
      const res = await UserService.viewCart();
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        const fetchedProducts = res.data?.cart || [];
        setcartid(res.data?.cart?.id);
        setApiCartData(fetchedProducts);
        //console.log('cart detaillss', fetchedProducts);
      }
    } catch (err) {
      console.log("carterror", JSON.stringify(err))
      // handle network/error
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const GetPromo = async () => {
    try {
      setIsFetchingPromo(true);
      setIsLoadingProduct(true);
      const res = await UserService.GetPromo_Code();
      const data = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? res?.data);
      const list = Array.isArray(data) ? data : [];
      setPromoOptions(list);
      setSelectedPromoCode(null);
      setPromoModalVisible(true);
      //console.log('GetPromo', res?.data);

      return list;
    } catch (err) {
      console.log('GetPromo', JSON.stringify(err));
      Toast.show({ type: 'error', text1: 'Failed to fetch coupons' });
      return [];
    } finally {
      setIsFetchingPromo(false);
      setIsLoadingProduct(false);
    }
  };

  const Getshiping = async () => {
    try {
      setIsFetchingShipping(true);
      setIsLoadingProduct(true);
      const res = await UserService.Shiping();
      if (res && (res.status === HttpStatusCode.Ok || res.status === 200)) {

        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.error ?? res.data);
        const options = Array.isArray(data) ? data : [];
        setShippingOptions(options);
        const firstActive = options.find((o: any) => o.is_active === '1' || o.is_active === 1) || options[0];
        if (firstActive) setSelectedShippingId(Number(firstActive.id));
        return options;
      } else {
        console.log('Getshiping response', res?.data);
        return [];
      }
    } catch (err) {
      console.log('Getshiping error', err);
      return [];
    } finally {
      setIsFetchingShipping(false);
      setIsLoadingProduct(false);
    }
  };

  const PlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('', 'Please, select Address');
      return;
    }
    const payload = {
      cart_id: cartid,
      address_id: selectedAddress?.id,
      shipping_id: selectedShippingId || 1,
    };
    try {
      setIsLoadingProduct(true);
      const res = await UserService.Placeorder(payload);
      if (res && res.data && (res.status === HttpStatusCode.Ok || res.status === 200)) {
        setShippingModalVisible(false);
        // navigation.navigate('PaymentSuccess');
        console.log('PlaceOrder', res?.data);
        setPaymentUrl(res.data.payment_url);
        setShowWebView(true);
      } else {
        console.log('error', res?.data);
      }
    } catch (err) {
      console.log('error', JSON.stringify(err));
    } finally {
      setIsLoadingProduct(false);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/Png/back.png')}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        {cartData?.items?.length !== 0 && cartData?.length !== 0 ? <ScrollView
          contentContainerStyle={{ paddingBottom: 0 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View
            style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: 10,
              margin: 5,
              marginTop: 10,
            }}
          >
            {/* Shipment of items */}
            <Text style={styles.sectionTitle}>
              Shipment of {cartData?.items?.length} items
            </Text>

            <FlatList
              data={cartData?.items || []}
              keyExtractor={(item, index) => (item.id ?? `${item.product_id}-${index}`).toString()}
              renderItem={renderShipmentItem}
              scrollEnabled={false}
              style={{ marginBottom: 20 }}
            />
          </View>

          {/* You Might Also Like */}
          {items.length !== 0 ? <View
            style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: 10,
              margin: 5,
              marginTop: 10,
            }}
          >
            <Text style={styles.sectionTitle}>You Might Also Like</Text>
            <FlatList
              data={items}
              horizontal
              keyExtractor={item => item.id}
              renderItem={renderSuggestionItem}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
            />

            {items.length >= 3 ?
              <TouchableOpacity onPress={() => navigation.navigate('WishlistScreen')} >
                <View
                  style={{
                    backgroundColor: '#F3F3F3',
                    borderRadius: 6,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    paddingVertical: 7,
                    margin: 20,
                  }}
                >
                  <Image
                    source={require('../../assets/Png/Ellipse.png')}
                    style={{
                      width: 14,
                      height: 14,
                      alignSelf: 'center',
                      right: 10,
                    }}
                  />
                  <Text
                    style={[
                      styles.moveToWishlistText,
                      { alignSelf: 'center', color: '#000' },
                    ]}
                  >
                    See all products
                  </Text>
                  <Image
                    source={require('../../assets/Png/next.png')}
                    style={{ width: 12, height: 12, alignSelf: 'center', left: 10 }}
                  />
                </View>
              </TouchableOpacity> : null}
          </View> : null}

          {/* Use Coupons */}
          <TouchableOpacity style={styles.couponBtn} activeOpacity={0.8} onPress={async () => { await GetPromo(); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/Png/discount.png')}
                style={{
                  width: 25,
                  height: 25,
                  marginLeft: 10,
                  alignSelf: 'center',
                }}
              />
              <Text style={styles.couponText}>Use Coupons</Text>
            </View>
            <Image
              source={require('../../assets/Png/next.png')}
              style={{
                width: 10,
                height: 10,
                marginRight: 10,
                alignSelf: 'center',
              }}
            />
          </TouchableOpacity>

          <Modal visible={promoModalVisible} transparent animationType="slide" onRequestClose={() => setPromoModalVisible(false)}>
            <TouchableWithoutFeedback onPress={() => setPromoModalVisible(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <TouchableWithoutFeedback>
                  <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' }}>
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3 }} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Available Coupons</Text>
                    {isFetchingPromo ? (
                      <ActivityIndicator size="small" color="#5DA53B" />
                    ) : promoOptions.length === 0 ? (
                      <Text style={{ textAlign: 'center', color: '#666' }}>No coupons available</Text>
                    ) : (
                      <FlatList
                        data={promoOptions}
                        keyExtractor={(it, idx) =>
                          (it.id ?? it.code ?? it.promo_code ?? idx).toString()
                        }
                        renderItem={({ item }) => {
                          // 🧠 Safely get the promo code value
                          const code =
                            item?.code ??
                            item?.promo_code ??
                            item?.promo ??
                            item?.title ??
                            'N/A';

                          const desc = item?.description ?? '';
                          const discountType = item?.discount_type ?? '';
                          const discountValue = item?.discount ?? item?.value ?? '';

                          // ✅ check if this is the selected coupon
                          const isSelected = selectedPromoCode?.code === String(code);

                          return (
                            <TouchableOpacity
                              onPress={() =>
                                setSelectedPromoCode({
                                  code: String(code),
                                  type: discountType,
                                  discount: discountValue,
                                })
                              }
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: isSelected ? '#AEB254' : '#EAEAEA',
                                backgroundColor: isSelected ? '#F7F9E5' : '#fff',
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 10,
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '700' }}>{code}</Text>
                                {desc ? (
                                  <Text style={{ color: '#666', marginTop: 4 }}>{desc}</Text>
                                ) : null}
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 12, color: '#888' }}>
                                  {discountValue}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        }}
                        contentContainerStyle={{ paddingBottom: 10 }}
                      />
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <TouchableOpacity onPress={() => setPromoModalVisible(false)} style={{ backgroundColor: '#eee', paddingVertical: 12, borderRadius: 28, alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#333' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => SetPromo()} disabled={isApplyingPromo} style={{ backgroundColor: '#E2E689', paddingVertical: 12, borderRadius: 28, alignItems: 'center', flex: 1 }}>
                        <Text style={{ color: '#000', fontWeight: '700' }}>{isApplyingPromo ? 'Applying...' : 'Apply Coupon'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Bill details */}
          {cartData.length !== 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#D9D9D9',
                borderRadius: 12,
                margin: 10,
                padding: 10,
              }}
            >
              <Text style={styles.billTitle}>Bill details</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Total</Text>
                <Text style={styles.billValue}>{cartData?.total_amount ?? 0} €</Text>
              </View>

              {appliedPromo && (
                <View style={styles.billRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.billLabel, { color: '#E2E689' }]}>
                      Coupon ({appliedPromo.code ?? appliedPromo.promo_code})
                    </Text>
                    <TouchableOpacity onPress={removeCoupon} style={{ marginLeft: 6 }}>
                      <Text style={{ color: '#FF0000', fontSize: 12 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[
                      styles.billValue,
                      { color: '#E2E689', fontWeight: '700' },
                    ]}
                  >
                    -{discountAmount.toFixed(2)} €
                  </Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { fontWeight: '500' }]}>
                  Delivery Charges
                </Text>
                <Text
                  style={[
                    styles.billValue,
                    { color: '#878B2F', fontWeight: '600' },
                  ]}
                >
                  Free
                </Text>
              </View>

              <View style={{ borderWidth: 0.6, width: '100%', borderColor: '#D9D9D9', marginVertical: 10 }}></View>

              <View style={styles.billRow}>
                <Text
                  style={[
                    styles.billLabel,
                    { fontWeight: '700', fontSize: 14 },
                  ]}
                >
                  Grand total
                </Text>
                <Text
                  style={[
                    styles.billValue,
                    { fontWeight: '700', fontSize: 14 },
                  ]}>
                  {(Number(cartData?.total_amount ?? 0) - discountAmount).toFixed(2)} €
                </Text>
              </View>
            </View>
          ) : null}

          {/* Delivery address */}
          <View style={styles.deliveryAddressCard}>
            <Image
              source={Images.home}
              style={{ width: 20, height: 20, alignSelf: 'center', tintColor: '#878B2F' }}
            />

            <View style={{ alignSelf: 'center', }}>
              <Text style={styles.deliveryAddressTitle}>
                {selectedAddress?.address_type ? `Delivering to ${selectedAddress.address_type?.toString().charAt(0).toUpperCase()}${selectedAddress.address_type?.toString().slice(1)}` : 'Delivering to Home'}
              </Text>
              <Text style={styles.deliveryAddress}>
                {selectedAddress ? `${selectedAddress.name}, ${selectedAddress.full_address}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}${selectedAddress.postal_code ? `, ${selectedAddress.postal_code}` : ''}${selectedAddress.phone ? ` • ${selectedAddress.phone}` : ''}` : 'Please Select Delivery Address'}
              </Text>
            </View>


            <TouchableOpacity style={{ alignSelf: 'center', }} activeOpacity={0.7} onPress={async () => {
              const opts = await Getshiping();
              if (opts && opts.length) {
                setShippingModalVisible(true);
              }
            }}
            >
              <Text style={styles.changeAddress}>{selectedAddress ? 'Change' : 'Select'}</Text>
            </TouchableOpacity>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            style={styles.checkoutButton}
            activeOpacity={0.8}
            onPress={async () => {
              if (!selectedAddress) {
                Alert.alert('', 'Please, select Address');
                return;
              }
              await PlaceOrder();
            }}
          >
            <Image
              source={require('../../assets/Png/shopping-cart.png')} tintColor={'#000'}
              style={{
                width: 20,
                height: 20,
                right: 10
              }}
            />
            <Text style={styles.checkoutBtnText}>Check Out</Text>
          </TouchableOpacity>

        </ScrollView> :
          <View style={{ justifyContent: "center", alignSelf: "center", flex: 1, }}>
            <Text style={[styles.headerTitle, { alignSelf: "center", marginBottom: 10 }]}>No Item Found</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BottomTabScreen')}>
              <View style={{ width: widthPercentageToDP(70), borderRadius: 12, backgroundColor: '#E2E689', paddingVertical: 12, alignSelf: "center" }}>
                <Text style={{ fontSize: 14, alignSelf: "center" }}>Continue For shopping</Text>
              </View>
            </TouchableOpacity>
          </View>}
      </View >

      {/* Shipping selection modal */}
      <Modal visible={shippingModalVisible} transparent animationType="slide" onRequestClose={() => setShippingModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setShippingModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' }}>
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Delivery Method</Text>
                {isFetchingShipping ? (
                  <ActivityIndicator size="small" color="#E2E689" />
                ) : (
                  <FlatList
                    data={shippingOptions}
                    keyExtractor={(it) => String(it.id)}
                    renderItem={({ item }) => {
                      const isSelected = Number(item.id) === Number(selectedShippingId);
                      return (
                        <TouchableOpacity
                          onPress={() => { setSelectedShippingId(Number(item.id)), GetCartDetails() }}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            borderWidth: 1,
                            borderColor: isSelected ? '#AEB254' : '#EAEAEA',
                            backgroundColor: isSelected ? '#F7F9E5' : '#fff',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 10,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '600', fontSize: 14 }}>{item.type}</Text>
                            <Text style={{ color: '#666', marginTop: 4, fontSize: 12 }}>Estimated Time: {item.estimated_time}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: '#888', fontSize: 14, fontWeight: '600', }}>Cost</Text>
                            <Text style={{ color: '#AEB254', fontSize: 12 }}>{item.cost} €</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    contentContainerStyle={{ paddingBottom: 10 }}
                  />
                )}

                <TouchableOpacity onPress={() => { setShippingModalVisible(false), setModalAddress(true) }}

                  style={{ backgroundColor: '#AEB254', paddingVertical: 14, borderRadius: 28, alignItems: 'center', marginTop: 8 }}
                >
                  <Text style={{ color: '#000', fontWeight: '700' }}>Continue to Address</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <LoginModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onGoogleLogin={() => Alert.alert('Google Login')}
        onFacebookLogin={() => Alert.alert('Facebook Login')}
        phoneNumber="+420 605 476 490"
        onVerify={otp => Alert.alert('OTP Verified', otp)}
      />

      {/* Payment WebView */}
      {showWebView && (
        <View style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 999 }}>
          {/* Header */}
          <View
            style={{
              height: 60,
              backgroundColor: '#f5f5f5',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#ddd',
            }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Payment</Text>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Text style={{ fontSize: 18, color: '#000' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            style={{ flex: 1, }}
            source={{ uri: paymentUrl }}
            onNavigationStateChange={navState => {
              console.log("thankyuu", navState.url)
              if (navState.url.includes('payment-success')) {
                setTimeout(() => {
                  setShowWebView(false);
                  // Toast.show({ type: 'success', text1: 'Payment complete!' });
                  GetCartDetails();
                  // navigation.navigate('YourBooking');
                }, 2000);
              } else if (navState.url.includes('cancel')) { // Replace with your actual cancel URL
                setShowWebView(false);
                // Toast.show({ type: 'error', text1: 'Payment cancelled.' });
              }
            }}
          />
        </View>
      )}

      <AddressModal
        visible={modalAddress}
        onClose={() => setModalAddress(false)}
        onAddNew={() => { setModalAddress(false); setmodalAddressADD(true); }}
        onSelect={(addr: any) => {
          setSelectedAddress(addr);
          //console.log('selectadres', addr);
          setModalAddress(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    top: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.3,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 10,
  },
  shipmentItemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  shipmentImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  shipmentName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#444',
  },
  shipmentWeight: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  shipmentPrice: {
    marginTop: 4,
    fontWeight: '600',
    fontSize: 14,
    color: '#111',
  },
  moveToWishlistBtn: {
    marginTop: 6,
  },
  moveToWishlistText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E2E689',
  },
  qtyControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E689',
    backgroundColor: '#E2E689',
    width: 100,
    justifyContent: 'center',
    marginTop: 4,
  },
  qtyBtn: {
    paddingHorizontal: 0,
  },
  qtyText: {
    paddingHorizontal: 12,
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
  },
  wishlistItemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 120,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    alignItems: 'center',
  },
  wishlistImage: {
    width: 84,
    height: 70,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  wishlistName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
  wishlistPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
    marginTop: 2,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 120,
    padding: 10,
    borderWidth: 1, borderColor: '#D9D9D9',
  },
  suggestionImage: {
    width: 84,
    height: 70,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  suggestionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
  suggestionPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E689',
    marginTop: 2,
  },
  seeAllBtn: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFD56C',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#5E6935',
    fontWeight: '600',
    fontSize: 14,
  },
  couponBtn: {
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  couponText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#000',
    marginLeft: 10,
  },

  billTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 12,
    color: '#878B2F',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 14,
    color: '#444',
  },
  billValue: {
    fontSize: 14,
    color: '#444',
  },
  deliveryAddressCard: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    width: SCREEN_WIDTH - 0,
    borderTopWidth: 1,
    borderColor: '#D9D9D9',
  },
  deliveryAddressTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#878B2F',
  },
  deliveryAddress: {
    fontSize: 14,
    marginTop: 6,
    color: '#444',
    width: SCREEN_WIDTH - 150,
  },
  changeAddress: {
    color: '#878B2F',
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  checkoutButton: {
    bottom: 20,
    marginVertical: 20,
    alignSelf: 'center',
    backgroundColor: '#E2E689',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 32,
    width: SCREEN_WIDTH - 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  checkoutBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default CheckoutScreen;