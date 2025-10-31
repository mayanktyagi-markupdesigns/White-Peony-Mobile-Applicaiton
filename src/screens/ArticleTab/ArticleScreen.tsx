import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  ImageBackground,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import { Image_url, UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import { formatDate } from '../../helpers/helpers';
import { widthPercentageToDP } from '../../constant/dimentions';
const { width } = Dimensions.get('window');


const ArticleScreen = ({ navigation }: any) => {
  const { showLoader, hideLoader } = CommonLoader();
  const [activeIndex, setActiveIndex] = useState(0);
  const viewRef = useRef<any>(null);
  const [sampleArticle, setsampleArticle] = React.useState<any[]>([]);
  const [justForYouModalVisible, setJustForYouModalVisible] = useState(false);
  const [trendingModalVisible, setTrendingModalVisible] = useState(false);


  useEffect(() => {
    ArticleList();
  }, [])


  const ArticleList = async () => {
    try {
      showLoader();
      const res = await UserService.articles();
      hideLoader();
      if (res?.status === HttpStatusCode.Ok && res?.data) {
        const { message, data } = res.data;
       // console.log("aitcle response data:", res.data);
        Toast.show({ type: "success", text1: message });
        setsampleArticle(data || []);

      } else {
        Toast.show({
          type: "error",
          text1: res?.data?.message || "Something went wrong!",
        });
      }
    } catch (err: any) {
      hideLoader();
      console.log("Error in EventList:", JSON.stringify(err));
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Something went wrong! Please try again.",
      });
    }
  };

  const renderUpcoming = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ArticleDetails', { article: item.id })} activeOpacity={0.8}>
      <ImageBackground
        source={{ uri: Image_url + item.image }}
        style={[styles.upCard, { width: width - 64 }]}
        imageStyle={{ borderRadius: 12 }}
      >
        <View style={styles.upBadgeRow}>
          <View style={styles.readBadge}>
            <Text style={styles.readBadgeText}>20 Minute Read</Text>
          </View>
          <TouchableOpacity style={styles.bookmarkBtn}>
            <Text style={{ fontSize: 18 }}>🔖</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.upTitleWrap}>
          <Text numberOfLines={2} style={styles.upTitleWhite}>
            {item.content}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderNear = ({ item }: { item: any }) => (
    <>
      <TouchableOpacity onPress={() => navigation.navigate('ArticleDetails', { article: item.id })} activeOpacity={0.8}>

        <View style={styles.nearCard}>
          <Image source={{ uri: Image_url + item.image }} style={styles.nearImage} />
          <View style={{ flex: 1 }}>
            <View style={styles.nearBody}>
              <Text numberOfLines={2} style={styles.nearTitle}> {item.content} </Text>
              {/* <View style={{ backgroundColor: '#E2E689', width: 25, height: 25, borderRadius: 10, alignSelf: "center", justifyContent: 'center' }}>
                <Image source={require('../../assets/Png/bookmark.png')} style={{ width: 15, height: 15, alignSelf: 'center' }} />
              </View> */}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../../assets/Png/clock.png')} style={{ width: 15, height: 15, }} />
              <Text style={styles.nearDate}>{formatDate(item.updated_at)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <Image source={require('../../assets/Png/eye.png')} tintColor={'#E2E689'} style={{ width: 15, height: 15, }} />
              <Text style={styles.nearDate}>{item.views}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{ borderBottomColor: '#D9D9D9', borderBottomWidth: 1, marginVertical: 10, width: '90%', alignSelf: 'center' }}></View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </View> */}
      <View style={{ backgroundColor: '#FFFFF0', height: 160 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Articles</Text>
        </View>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search Products...."
            placeholderTextColor={'#707070'}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.microphone}>
            <Image
              source={require('../../assets/Png/search.png')}
              style={styles.iconSmall}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Just For You modal */}
      <Modal visible={justForYouModalVisible} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Just For You</Text>
              <TouchableOpacity onPress={() => setJustForYouModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={sampleArticle}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderUpcoming}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* Trending modal */}
      <Modal visible={trendingModalVisible} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Trending Articles</Text>
              <TouchableOpacity onPress={() => setTrendingModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={sampleArticle}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderNear}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 12 }}
            />
          </View>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Just For You</Text>
          <TouchableOpacity onPress={() => setJustForYouModalVisible(true)}>
            <Text style={styles.seeMore}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 10 }}>
          <FlatList
            ref={viewRef}
            data={sampleArticle}
            keyExtractor={i => i.id}
            renderItem={renderUpcoming}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 12 }}
            onMomentumScrollEnd={ev => {
              const newIndex = Math.round(
                ev.nativeEvent.contentOffset.x / (width - 64 + 12),
              );
              if (!isNaN(newIndex)) setActiveIndex(newIndex);
            }}
          />

          <View style={styles.dotsRow}>
            {sampleArticle.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Trending Articles</Text>
          <TouchableOpacity onPress={() => setTrendingModalVisible(true)}>
            <Text style={styles.seeMore}>View all</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            width: '90%',
            alignSelf: 'center',
            justifyContent: 'center',
            height: 'auto',
            borderWidth: 1,
            borderColor: '#D9D9D9',
            borderRadius: 10,
            marginTop: 10,
          }}
        >
          <FlatList
            data={sampleArticle}
            keyExtractor={i => i.id}
            renderItem={renderNear}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default ArticleScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
    height: 175,
  },
  upImage: { width: '100%', height: 120, borderRadius: 10 },
  upBody: { padding: 10 },
  upTitle: { fontSize: 14, fontWeight: '700' },
  upMeta: { fontSize: 12, color: '#6B6B6B', marginTop: 6 },
  upSeats: { marginTop: 8, color: '#6B6B6B', fontWeight: '600' },
  upBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  readBadge: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  readBadgeText: { fontSize: 12, color: '#6B6B6B' },
  bookmarkBtn: { backgroundColor: '#E2E689', padding: 6, borderRadius: 18 },
  upTitleWrap: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  upTitleWhite: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#AEB254', width: 18, borderRadius: 4 },
  nearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
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
  nearBody: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  nearTitle: { fontSize: 14, fontWeight: '700', width: widthPercentageToDP(55), },
  nearMeta: { fontSize: 12, color: '#6B6B6B', marginTop: 6 },
  nearDate: { fontSize: 12, color: '#6B6B6B', marginTop: 0, marginLeft: 10 },
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
