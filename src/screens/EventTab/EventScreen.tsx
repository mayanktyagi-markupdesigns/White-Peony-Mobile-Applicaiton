import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import { Image_url, UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import Toast from 'react-native-toast-message';
import { LocalStorage } from '../../helpers/localstorage';
import { formatDate } from '../../helpers/helpers';
import Geolocation from 'react-native-geolocation-service';
import { check, request, RESULTS, PERMISSIONS } from 'react-native-permissions';
import { widthPercentageToDP } from '../../constant/dimentions';
const { width } = Dimensions.get('window');

const EventScreen = ({ navigation }: any) => {
  const { showLoader, hideLoader } = CommonLoader();
  const [location, setLocation] = useState<any>(null);
  const [sampleEvents, setsampleEvents] = React.useState<any[]>([]);
  const [NearbyEvents, setNearbyEvents] = React.useState<any[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [upcomingModalVisible, setUpcomingModalVisible] = useState(false);
  const [nearbyModalVisible, setNearbyModalVisible] = useState(false);

  useEffect(() => {
    requestPermissionAndGetLocation();
    EventList();
  }, []);

  // 👇 Handles permission for both platforms
  const requestPermissionAndGetLocation = async () => {
    try {
      const permissionType =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

      // Step 1: Check current permission
      const status = await check(permissionType);

      if (status === RESULTS.GRANTED) {
        getCurrentLocation();
      } else if (status === RESULTS.DENIED || status === RESULTS.LIMITED) {
        // Step 2: Ask for permission
        const reqStatus = await request(permissionType);

        if (reqStatus === RESULTS.GRANTED || reqStatus === RESULTS.LIMITED) {
          getCurrentLocation();
        } else {
          Alert.alert(
            'Location Permission Needed',
            'You need to allow location permission to use this feature.',
            [
              {
                text: 'Retry',
                onPress: async () => {
                  const retryStatus = await request(permissionType);
                  if (retryStatus === RESULTS.GRANTED || retryStatus === RESULTS.LIMITED) {
                    getCurrentLocation();
                  } else {
                    Alert.alert('Still Denied', 'Permission not granted.');
                  }
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ],
            { cancelable: true }
          );
        }
      } else if (status === RESULTS.BLOCKED) {
        // Don’t open settings — just show message
        Alert.alert(
          'Permission Blocked',
          'You have permanently denied location permission. Please enable it later in settings if you change your mind.'
        );
      }
    } catch (error) {
      console.warn('Permission Error:', error);
    }
  };

  // 👇 Get current location
  const getCurrentLocation = () => {
    showLoader();
    Geolocation.getCurrentPosition(
      position => {
        hideLoader();
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        console.log('Current Location:', latitude, longitude);
        EventNearbyList(latitude, longitude);
      },
      error => {
        hideLoader();
        console.log('Location Error:', error);
        Alert.alert('Error', 'Unable to fetch location. Please try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const EventList = async () => {
    try {
      showLoader();
      const res = await UserService.events();
      hideLoader();

      if (res?.status === HttpStatusCode.Ok && res?.data) {
        const { events } = res.data;
        setsampleEvents(events || []);
      } else {
        Toast.show({
          type: 'error',
          text1: res?.data?.message || 'Something went wrong!',
        });
      }
    } catch (err: any) {
      hideLoader();
      console.log('Error in EventList:', JSON.stringify(err));
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || 'Something went wrong! Please try again.',
      });
    }
  };

  const EventNearbyList = async (latitude: number, longitude: number) => {
    const payload = {
      lat: latitude,
      lng: longitude,
      radius: 15,
    };
    try {
      showLoader();
      const res = await UserService.nearbyevents(payload);
      hideLoader();

      if (res?.status === HttpStatusCode.Ok && res?.data) {
        const { events } = res.data;
        setNearbyEvents(events || []);
      } else {
        Toast.show({
          type: 'error',
          text1: res?.data?.message || 'Something went wrong!',
        });
      }
    } catch (err: any) {
      hideLoader();
      console.log('Error in EventNearbyList:', JSON.stringify(err));
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || 'Something went wrong! Please try again.',
      });
    }
  };

  const renderUpcoming = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.upCard} activeOpacity={0.8}>
      <Image source={{ uri: Image_url + item.image }} style={styles.upImage} />
      <View style={styles.upBody}>
        <Text numberOfLines={2} style={styles.upTitle}>
          {item.title}
        </Text>
        <Text style={styles.upMeta}>{item.address}</Text>
        <Text style={styles.upMeta}> {formatDate(item.event_date)}</Text>
        <Text style={styles.upMeta}>{item.capacity}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderNear = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.nearCard} onPress={() => navigation.navigate('EventDetails', { event: item.id })} activeOpacity={0.8}>
      <Image source={{ uri: Image_url + item.image }} style={styles.nearImage} />
      <View style={styles.nearBody}>
        <Text numberOfLines={1} style={styles.nearTitle}>
          {item.title}
        </Text>
        <Text style={styles.nearMeta}>
          {item.address} • {item.remaining_seats}
        </Text>
        <Text style={styles.nearDate}>{formatDate(item.event_date)}</Text>
      </View>
    </TouchableOpacity>
  );

  // --- Search helpers ---
  const performLocalSearch = (query: string) => {
    const q = query.toLowerCase();
    const combined = [...sampleEvents, ...NearbyEvents];
    const uniqueMap = new Map<string, any>();
    combined.forEach((it: any) => {
      if (!it || !it.id) return;
      if (!uniqueMap.has(String(it.id))) uniqueMap.set(String(it.id), it);
    });
    const deduped = Array.from(uniqueMap.values());
    const filtered = deduped.filter((ev: any) => {
      const title = (ev.title || '').toString().toLowerCase();
      const addr = (ev.address || '').toString().toLowerCase();
      const date = (ev.event_date || '').toString().toLowerCase();
      return title.includes(q) || addr.includes(q) || date.includes(q);
    });
    return filtered;
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      // client-side search - flexible and fast
      const results = performLocalSearch(trimmed);
      setSearchResults(results);
      setIsSearching(false);
      // optional: if you want server search, call API here
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  };

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: '#FFFFF0', height: 160 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search events..."
            placeholderTextColor={'#707070'}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                const results = performLocalSearch(searchQuery.trim());
                setSearchResults(results);
              }
            }}
          />
          {isSearching ? (
            <ActivityIndicator style={{ marginLeft: 8 }} size="small" color="#2DA3C7" />
          ) : searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.microphone}>
              <Text style={{ fontWeight: '700' }}>Clear</Text>
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
      </View>

      {/* single FlatList as main vertical container to avoid nested VirtualizedLists */}
      <FlatList
        data={searchQuery.trim() ? searchResults : NearbyEvents}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderNear}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {searchQuery.trim() ? 'Search Results' : 'Upcoming Events'}
              </Text>
              <TouchableOpacity onPress={() => setUpcomingModalVisible(true)}>
                <Text style={styles.seeMore}>
                  {searchQuery.trim() ? `${searchResults.length} found` : 'See more'}
                </Text>
              </TouchableOpacity>
            </View>

            {searchQuery.trim() ? (
              isSearching ? (
                <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#2DA3C7" />
              ) : searchResults.length === 0 ? (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#666' }}>No results for "{searchQuery}"</Text>
                </View>
              ) : null
            ) : (
              <>
                <View style={{ marginTop: 10 }}>
                  <FlatList
                    data={sampleEvents}
                    keyExtractor={(i) => String(i.id)}
                    renderItem={renderUpcoming}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 16, paddingRight: 12 }}
                  />
                </View>

                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>Events Near You</Text>
                  <TouchableOpacity onPress={() => setNearbyModalVisible(true)}>
                    <Text style={styles.seeMore}>See more</Text>
                  </TouchableOpacity>
                </View>
                {/* spacer wrapper to keep styling consistent */}
                <View
                  style={{
                    width: '90%',
                    alignSelf: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#D9D9D9',
                    borderRadius: 10,
                    marginTop: 10,
                  }}
                />
              </>
            )}
          </View>
        )}
        ListEmptyComponent={() =>
          !searchQuery.trim() ? (
            <View style={{ padding: 20 }}>
              <Text style={{ color: '#666' }}>No nearby events found</Text>
            </View>
          ) : null
        }
      />
      {/* Upcoming events modal */}
      <Modal visible={upcomingModalVisible} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => setUpcomingModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={sampleEvents}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderUpcoming}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* Nearby events modal */}
      <Modal visible={nearbyModalVisible} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Events Near You</Text>
              <TouchableOpacity onPress={() => setNearbyModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={NearbyEvents}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderNear}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EventScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', top: Platform.OS === 'android' ? StatusBar.currentHeight : 0, },
  header: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  searchBtn: {
    marginLeft: 8,
    width: 44,
    height: 42,
    borderRadius: 20,
    backgroundColor: '#E2E689',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeMore: { color: '#AEB254' },
  upCard: {
    width: 220,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: 5,
  },
  upImage: { width: '100%', height: 120, borderRadius: 10 },
  upBody: { padding: 10 },
  upTitle: { fontSize: 14, fontWeight: '700' },
  upMeta: { fontSize: 12, color: '#6B6B6B', marginTop: 6 },
  upSeats: { marginTop: 8, color: '#6B6B6B', fontWeight: '600' },
  nearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderBottomWidth: 1, borderBottomColor: '#D9D9D9', width: widthPercentageToDP(95)
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
  nearImage: { width: 70, height: 70, borderRadius: 8, marginRight: 12 },
  nearBody: { flex: 1 },
  nearTitle: { fontSize: 14, fontWeight: '700', width: widthPercentageToDP(60),  },
  nearMeta: { fontSize: 12, color: '#6B6B6B', marginTop: 6 },
  nearDate: { fontSize: 12, color: '#6B6B6B', marginTop: 4 },
  iconSmall: { width: 14, height: 14 },
  bookBtn: {
    width: 48,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginLeft: 8,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
  },
});