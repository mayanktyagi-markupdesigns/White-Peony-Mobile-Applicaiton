import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Platform,
  StatusBar,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Image_url, UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import { formatDate } from '../../helpers/helpers';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constant';

const TABS = [
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'delivered', label: 'Delivered' },
];

type UiOrder = {
  id: string;
  date: string;
  statusText: string;
  productName: string;
  tracking_number: string;
  description: string;
  quantity: number;
  productImage?: string;
};

const OrdersScreen = ({ navigation }: { navigation: any }) => {
  const { showLoader, hideLoader } = CommonLoader();
  const [activeTab, setActiveTab] = useState('completed');
  const [searchText, setSearchText] = useState('');
  const [order, setOrder] = useState<UiOrder[]>([]);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [ratingID, setRatingID] = useState<string>('');

  useEffect(() => {
    OrderList();
  }, []);

  const OrderList = async () => {
    try {
      showLoader();
      const res = await UserService.order();
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        hideLoader();
        const apiOrders = Array.isArray(res?.data?.orders)
          ? res.data.orders
          : [];
        setOrder(apiOrders);
      } else {
        hideLoader();
      }
    } catch (err) {
      hideLoader();
      console.log('error', err);
    }
  };

  const PostReview = async () => {
    try {
      const payload = {
        rating: newRating,
        review: newComment || 'No comment',
      };

      showLoader();
      await UserService.Review(payload, ratingID)
        .then(async (res) => {
          hideLoader();
          if (res && res?.data && res?.status === HttpStatusCode.Ok) {
            Toast.show({
              type: 'success',
              text1: res?.data?.message,
            });
            OrderList();
            setRatingID('');
            setNewComment('');
            setNewRating(5);
            setWriteModalVisible(false);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Something went wrong!',
            });
          }
        })
        .catch((err) => {
          hideLoader();
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

  // 👇 FIXED VERSION
  const renderOrder = ({ item }: { item: any }) => {
    const deliveredDate = item?.updated_at ? formatDate(item?.updated_at) : '';

    return (
      <TouchableOpacity style={styles.orderCard} activeOpacity={0.8}>
        <View style={styles.deliveryInfo}>
          <Image
            source={require('../../assets/Png/orderLogo.png')}
            style={{
              width: 22,
              height: 22,
              backgroundColor: '#EAFDFF',
              borderRadius: 20,
            }}
          />
          <View style={{ marginLeft: 6 }}>
            <Text style={styles.deliveryDate}>
              {deliveredDate ? `Delivered ${deliveredDate}` : ''}
            </Text>
            <Text style={styles.deliveryStatus}>{item?.statusText || ''}</Text>
          </View>
          <Image
            source={require('../../assets/Png/next.png')}
            style={{ marginLeft: 'auto', width: 14, height: 14 }}
          />
        </View>

        <View style={styles.productInfo}>
          {item?.productImage ? (
            <Image
              source={{
                uri: Image_url + item?.items[0]?.product?.front_image,
              }}
              style={styles.productImage}
            />
          ) : (
            <Image
              source={require('../../assets/Png/product.png')}
              style={styles.productImage}
            />
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productName}>
              {item?.items[0]?.product?.name || ''}
            </Text>
            <Text style={styles.productName}>{item?.total_amount || ''} €</Text>
            <Text style={styles.productDesc}>{item?.tracking_number || ''}</Text>
            <Text style={styles.productQty}>Qty : {item?.items.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            setRatingID(item?.items[0]?.product?.id);
            setWriteModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.rateReviewRow}>
            <Text style={styles.rateReviewLabel}>Rate & Review </Text>
            <View style={{ flexDirection: 'row', marginTop: -10 }}>
              {[1, 2, 3, 4, 5].map((r) => {
                const rating = item?.items[0]?.product?.reviews[0]?.rating || 0;
                const isFull = rating >= r;
                const isHalf = rating >= r - 0.5 && rating < r;
                return (
                  <View
                    key={r}
                    style={{ width: 18, height: 18, position: 'relative' }}
                  >
                    <Text
                      style={{
                        color: '#ccc',
                        fontSize: 18,
                        position: 'absolute',
                      }}
                    >
                      ★
                    </Text>
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
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };


  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
      >

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Image source={require('../../assets/Png/back.png')} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={{ width: 24 }} /> {/* placeholder for symmetrical spacing */}
        </View>

        <View style={{
          flex: 1,
          backgroundColor: '#fff',
        }}>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Products..."
              placeholderTextColor={Colors.text[200]}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
              <Image source={require('../../assets/Png/search.png')} style={{ width: 16, height: 16 }} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.tabItem,
                    isActive ? styles.tabItemActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive ? styles.tabTextActive : null,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Orders List */}
          <FlatList
            keyExtractor={(item) => item.id}
            data={order}
            renderItem={renderOrder}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={{ marginTop: 40, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontSize: 16 }}>No orders found.</Text>
              </View>
            }
          />

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
                  placeholderTextColor={Colors.text[200]}
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


        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF',
    top: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  reviewItem: {
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    minHeight: 120,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  backButton: { width: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fcfcec',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 40,
    color: '#444',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#BFD56C',
    marginLeft: 10,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FCFCEC',
    marginHorizontal: 20,
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    marginHorizontal: 0,
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemActive: { backgroundColor: '#DEE9A0' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#AAA' },
  tabTextActive: { color: '#5E6935' },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    padding: 16,
  },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deliveryDate: { fontWeight: '500', color: '#5E6935', fontSize: 12 },
  deliveryStatus: { fontSize: 10, color: '#999' },
  productInfo: { flexDirection: 'row', marginBottom: 12 },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginRight: 16,
    resizeMode: 'cover',
  },
  productDetails: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 4 },
  productDesc: { fontSize: 12, color: '#888', marginBottom: 6 },
  productQty: { fontSize: 12, color: '#555', fontWeight: '500' },
  rateReviewRow: {
    backgroundColor: '#FCFCEC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateReviewLabel: { fontSize: 14, fontWeight: '600', color: '#5E6935' },
});

export default OrdersScreen;
