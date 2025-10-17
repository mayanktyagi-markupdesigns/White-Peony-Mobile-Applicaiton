import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import { formatDate } from '../../helpers/helpers';

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
  tracking_number: String;
  description: string;
  quantity: number;
  productImage?: string;
};

const OrdersScreen = ({ navigation }: { navigation: any }) => {
  const { showLoader, hideLoader } = CommonLoader();
  const [activeTab, setActiveTab] = useState('completed');
  const [searchText, setSearchText] = useState('');
  const [order, setorder] = useState<UiOrder[]>([]);



  useEffect(() => {
    OrderList();
  }, [])

  const OrderList = async () => {
    try {
      showLoader();
      const res = await UserService.order();
      if (res && res.data && res.status === HttpStatusCode.Ok) {
        hideLoader()
        const apiOrders = Array.isArray(res?.data?.orders) ? res.data.orders : [];
        const normalized = apiOrders.map((o: any, idx: number) => {
          const firstItem = Array.isArray(o?.items) && o.items.length > 0 ? o.items[0] : undefined;
          const qty = typeof o?.quantity === 'number' ? o.quantity : (firstItem?.quantity ?? 0);
          const image = firstItem?.image || firstItem?.front_image || firstItem?.product_image || undefined;
          return {
            id: String(o?.id ?? o?.order_id ?? idx),
            date: o?.date ?? o?.order_date ?? o?.created_at ?? '',
            statusText: o?.status_text ?? o?.status ?? '',
            productName: apiOrders[0]?.items[0]?.product?.name ?? '',
            description: apiOrders[0]?.items[0]?.product?.description ?? '',
            tracking_number: o?.tracking_number ?? '',
            quantity: qty ?? 0,
            productImage: image,
          };

        });

        setorder(normalized)
      } else {
        hideLoader()
        console.log("error", res?.data)
        // handle non-OK response if needed
      }
    } catch (err) {
      hideLoader()
      console.log("error", err)
      // handle network/error
    }
  };


  const renderOrder = ({ item }: { item: UiOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => {
        /* Navigate to order detail or similar */
      }}
    >
      {/* Delivery Info */}
      <View style={styles.deliveryInfo}>
        <Image source={require('../../assets/Png/orderLogo.png')} style={{ width: 22, height: 22, backgroundColor: '#EAFDFF', borderRadius: 20 }} />

        <View style={{ marginLeft: 6 }}>
          <Text style={styles.deliveryDate}>Delivered {formatDate(item?.date) || ''}</Text>
          <Text style={styles.deliveryStatus}>{item?.statusText || ''}</Text>
        </View>
        <Image source={require('../../assets/Png/next.png')} style={{ marginLeft: 'auto', width: 14, height: 14, }} />
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        {item?.productImage ? (
          <Image source={{ uri: item.productImage }} style={styles.productImage} />
        ) : (
          <Image source={require('../../assets/Png/product.png')} style={styles.productImage} />
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item?.productName || ''}</Text>
          <Text style={styles.productName}>{item?.description || ''}</Text>
          <Text style={styles.productDesc}>{item?.tracking_number || ''}</Text>
          <Text style={styles.productQty}>Qty : {String(item?.quantity ?? 0).padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Rate & Review */}
      <View style={styles.rateReviewRow}>
        <Text style={styles.rateReviewLabel}>Rate & Review</Text>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map(r => (
            <View key={r}>
              <Text style={{ color: '#F0C419', fontSize: 16 }}>★</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Image source={require('../../assets/Png/back.png')} style={{ width: 20, height: 20 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: 24 }} /> {/* placeholder for symmetrical spacing */}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Products..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ color: '#888', fontSize: 16 }}>No orders found.</Text>
          </View>
        }
      />

      {/* Bottom tab simulation (optional) */}
      {/* Replace this with your real tab navigator */}

    </View>
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
  backButton: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
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
  tabItemActive: {
    backgroundColor: '#DEE9A0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
  },
  tabTextActive: {
    color: '#5E6935',
  },
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
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryDate: {
    fontWeight: '500',
    color: '#5E6935',
    fontSize: 12,
  },
  deliveryStatus: {
    fontSize: 10,
    color: '#999',
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginRight: 16,
    resizeMode: 'cover',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  productQty: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  rateReviewRow: {
    backgroundColor: '#FCFCEC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateReviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5E6935',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  bottomTab: {
    height: 60,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
  },
  bottomTabItemActive: {
    position: 'relative',
  },
  bottomTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    width: 40,
    backgroundColor: '#5E6935',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});

export default OrdersScreen;