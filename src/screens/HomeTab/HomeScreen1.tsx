import { View, Text, StatusBar, Image, FlatList, Dimensions, StyleSheet, ScrollView, Platform, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity, ImageBackground } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { heightPercentageToDP, widthPercentageToDP } from '../../constant/dimentions';
import { Colors } from '../../constant';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import { Image_url, UserService } from '../../service/ApiService';
import { HttpStatusCode } from 'axios';
import { formatDate } from '../../helpers/helpers';
import { WishlistContext } from '../../context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const SMALL_CARD_WIDTH = Math.round(width * 0.30);
const WISHLIST_CARD_WIDTH = Math.round(width * 0.35);

const GAP = 12;
const SMALL_HEIGHT = 120;
const BIG_HEIGHT = SMALL_HEIGHT * 2 + GAP;


const HomeScreen1 = ({ navigation }: any) => {
    const { toggleWishlist, isWishlisted, removeFromWishlist } = React.useContext(WishlistContext);
    const [category, setApiCateProducts] = useState([]);
    const [categoryProduct, setcategoryProduct] = useState([]);
    const [FeaturesProduct, setFeaturesProduct] = useState([]);
    const [salesProduct, setsalesProduct] = useState([]);
    const [apiRecommend, setApiRecommend] = useState<any[]>();
    const [wishlistitem, setwishlistitem] = useState<any[]>();
    const [orderitem, setorderitem] = useState<any[]>();
    const [lowestitem, setlowestitem] = useState<any[]>();
    const [Promotional, setPromotional] = useState<any[]>([]);

    const { showLoader, hideLoader } = CommonLoader();
    const topPadding = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
    const [activeRec, setActiveRec] = useState(0);
    const recRef = useRef<FlatList<any>>(null);

    const onRecommendedScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (WISHLIST_CARD_WIDTH + 12));
        setActiveRec(index);
    };

    useEffect(() => {
        GetCategoryProducts();
        featuredproduct();
        bigsale();
        RecommendProducts();
        fetchServerWishlist();
        OrderList();
        ApiSorting();
        GetHeader();

    }, [])

    const GetHeader = async () => {
        try {
            showLoader();
            const res = await UserService.header();
            if (res && res.data && res.status === HttpStatusCode.Ok) {
                const banners = res?.data?.data?.b2c || [];
                //console.log("header", res?.data?.data?.b2c)

                setPromotional(banners)
            } else {
                // handle non-OK response if needed
            }
        } catch (err) {
            // handle network/error
        } finally {
            hideLoader();
        }
    };

    const GetCategoryProducts = async () => {
        try {
            showLoader();
            const res = await UserService.GetCategory();
            if (res && res.data && res.status === HttpStatusCode.Ok) {
                hideLoader();
                const fetchedProducts = res.data?.categories || [];
                // console.log("catorgry", fetchedProducts)
                setApiCateProducts(fetchedProducts);
                GetCategoryID(1);
            } else {
                // handle non-OK response if needed
            }
        } catch (err) {
            console.log("error catogry", err)
            hideLoader();
            // handle network/error
        }
    };

    const GetCategoryID = async (categoryId: any) => {
       // console.log("itemid", categoryId)
        try {
            showLoader();
            const res = await UserService.GetCategoryByID(categoryId);
            if (res && res.data && res.status === HttpStatusCode.Ok) {
                hideLoader();
                const fetchedProducts = res?.data?.data || [];
                //console.log("GetCategoryByID", fetchedProducts)
                setcategoryProduct(fetchedProducts);
            } else {
                console.log("rescatdata", res?.data)
            }
        } catch (err) {
            console.log("error catogry", err)
            hideLoader();
            // handle network/error
        }
    };

    const featuredproduct = async () => {
        try {
            showLoader();
            const res = await UserService.featuredproducts();
            if (res && res.data && res.status === HttpStatusCode.Ok) {
                hideLoader();
                const fetchedProducts = res?.data?.data || [];
                //console.log("featuredproduct", fetchedProducts?.b2c[0]?.product?.front_image)
                setFeaturesProduct(fetchedProducts?.b2c);
            } else {
                console.log("featuredproductelse", res?.data)
            }
        } catch (err) {
            console.log("error featuredproduct", err)
            hideLoader();
            // handle network/error
        }
    };

    const bigsale = async () => {
        try {
            showLoader();
            const res = await UserService.bigsales();
            if (res && res.data && res.status === HttpStatusCode.Ok) {
                hideLoader();
                const fetchedProducts = res.data?.data || [];
                //console.log("bigsale", fetchedProducts?.b2c)
                setsalesProduct(fetchedProducts?.b2c);
            } else {
                console.log("else sales", res.data)
                // handle non-OK response if needed
            }
        } catch (err) {
            console.log("error catogry", err)
            hideLoader();
        }
    };

    const RecommendProducts = async () => {
        try {
            showLoader();
            const res = await UserService.recommended();
            if (res && res.data && res.status === HttpStatusCode.Ok) {
                hideLoader();
                const fetchedProducts = res.data?.data || [];
                setApiRecommend(fetchedProducts);
                //console.log("recommenddata", res.data?.data)
            } else {
                console.log("recommendelse", res?.data)
                // handle non-OK response if needed
            }
        } catch (err) {
            hideLoader();
            console.log("recommenderror", err)
            // handle network/error
        }
    };

    const fetchServerWishlist = async () => {
        try {
            showLoader();
            const res = await UserService.wishlist();
            const apiItems = res?.data?.data || [];
            hideLoader();

            setwishlistitem(apiItems);
            //console.log("addwishlist", apiItems)
        } catch (e) {
            hideLoader();
            const error = e as any;
            if (error.status === 401) {
                console.log('Unauthorized access - perhaps token expired');
            } else {
                console.log('Unauthorized access - perhaps token Required');
            }
        }
    };

    const OrderList = async () => {
        try {
            showLoader();
            const res = await UserService.order();
            if (res && res.data && res.status === HttpStatusCode.Ok) {
                hideLoader();
                const apiOrders = Array.isArray(res?.data?.orders) ? res.data.orders : [];
                //console.log("orderlist", apiOrders[0]?.items)
                setorderitem(apiOrders);
            } else {
                console.log("ordererr", res?.data)
                hideLoader();
            }
        } catch (err) {
            hideLoader();
            console.log('error', err);
        }
    };

    const ApiSorting = async () => {
        try {
            showLoader();
            const res = await UserService.Sorting('price_asc');

            if (res?.status === HttpStatusCode.Ok) {
                const sortedProducts = res?.data?.data || [];
                setlowestitem(sortedProducts);
                //console.log('ApiSorting -> setting products', sortedProducts[0]?.variants);
                //Toast.show({ type: 'success', text1: 'Products sorted successfully' });
            } else {
                console.log('Failed to sort products:', res);
                Toast.show({
                    type: 'error',
                    text1: 'Failed to sort products'
                });
            }
        } catch (err) {
            console.log('Sorting error:', err);
            Toast.show({
                type: 'error',
                text1: 'Failed to sort products'
            });
        }
    };

    const PromotionalBanner: React.FC<{ promotional: any[] }> = ({ promotional = [] as any[] }) => {
        if (!promotional.length) return null;

        return (
            <View style={{ marginVertical: 12 }}>

                {promotional.map((item: any, index: number) => (
                    <View key={String(index)} style={styles.page}>
                        <ImageBackground
                            source={{ uri: Image_url + item.image_url }}
                            style={styles.imageBackground}
                            resizeMode='cover'
                        >
                            <View style={{ position: 'absolute', top: '20%', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 }}>
                                <Text style={styles.title}>White Peony Tea Co</Text>
                                <Text style={[styles.title, { fontSize: 18, marginTop: 7 }]}>{item?.title}</Text>

                                <TouchableOpacity style={styles.button} onPress={() =>
                                    navigation.navigate('ProductDetails', { productId: item.product_id })}>

                                    <Text style={styles.buttonText}>Shop Now</Text>
                                </TouchableOpacity>
                            </View>
                        </ImageBackground>
                    </View >
                ))}

            </View >
        );
    };

    return (
        <View style={{ flex: 1, marginTop: topPadding, }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#fff', }}>

                <View style={{ backgroundColor: '#FFFFF0', paddingHorizontal: widthPercentageToDP(3) }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: heightPercentageToDP(3) }}>
                        <View />
                        <Image source={require('../../assets/peony_logo.png')} style={{ width: 140, height: 25, resizeMode: 'contain' }} />
                        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                            <View style={{ borderColor: '#A7A7A7', borderWidth: 1, borderRadius: 20, padding: 5, marginRight: 10 }}>
                                <Image source={require('../../assets/userx.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderColor: '#A7A7A7', borderWidth: 1, borderRadius: 30, height: 50, backgroundColor: '#fff' }}>
                        <Image source={require('../../assets/Searchx.png')} style={{ width: 20, height: 20, resizeMode: 'contain', marginLeft: 10, alignSelf: 'center' }} />
                        <Text style={{ alignSelf: 'center', color: '#A7A7A7', fontSize: 16, flex: 1, marginLeft: 10 }}>Search "Products"</Text>
                        <View style={{ borderWidth: 1, borderColor: '#A7A7A7', marginVertical: 8, right: 10 }} />
                        <Image source={require('../../assets/micx.png')} style={{ width: 20, height: 20, resizeMode: 'contain', marginRight: 10, alignSelf: 'center' }} />
                    </View>

                    <View style={{ marginVertical: heightPercentageToDP(2), flexDirection: 'row', alignItems: "center" }}>
                        <FlatList
                            data={category}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={(item) => {
                                return (
                                    <TouchableOpacity onPress={() => GetCategoryID(item?.item?.id)}>
                                        <View style={{ flexDirection: 'column', alignItems: 'center', marginHorizontal: 10 }}>
                                            <Image source={{ uri: Image_url + item?.item?.image }} style={{ width: 25, height: 25, resizeMode: "contain" }} />
                                            <Text style={{ fontWeight: '700', fontSize: 12, marginTop: heightPercentageToDP(1) }}>{item?.item?.name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )
                            }}
                        />
                    </View>
                    <View style={{ borderWidth: 0.7, borderColor: '#A7A7A7', width: widthPercentageToDP(95) }} />

                    {/* Categories as 2-column grid */}
                    {categoryProduct.length !== 0 ? (
                        <View style={styles.container}>
                            <View style={styles.row}>
                                {/* BIG CARD */}
                                <TouchableOpacity onPress={() =>
                                    navigation.navigate('ProductDetails', { productId: categoryProduct[0].id })}>
                                    <View style={[styles.card, { height: BIG_HEIGHT }]}>
                                        <Image source={{ uri: Image_url + categoryProduct[0].front_image }} style={styles.imageBig} />
                                        <Text numberOfLines={2} style={styles.title}>{categoryProduct[0].name}</Text>
                                        <View style={{ borderRadius: 4, backgroundColor: '#5f621a', width: 35, alignSelf: 'center', marginTop: 10 }}>
                                            <Text style={{ fontWeight: '700', fontSize: 12, alignSelf: 'center', padding: 5, color: '#fff', textDecorationLine: 'line-through', }}>{Math.round(categoryProduct[0]?.variants[0]?.price)}</Text>
                                        </View>
                                        <View style={{ borderRadius: 4, backgroundColor: '#E0CB54', width: 50, alignSelf: 'center' }}>
                                            <Text style={{ fontWeight: '700', fontSize: 12, alignSelf: 'center', padding: 5, color: '#000', }}>{Math.round(categoryProduct[0]?.variants[0]?.price)}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* RIGHT STACK: render one small card per item */}
                                <View style={styles.stack}>
                                    <View style={{ justifyContent: 'space-between', }}>
                                        {categoryProduct.slice(1, 3).map((item) => (
                                            <TouchableOpacity onPress={() =>
                                                navigation.navigate('ProductDetails', { productId: item.id })}>
                                                <View key={`${item.id}`} style={[styles.card, { height: SMALL_HEIGHT }]}>
                                                    <Image source={{ uri: Image_url + item.front_image }} style={styles.imageSmall} />
                                                    <Text numberOfLines={2} style={styles.title}>{item.name}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={{ justifyContent: 'space-between', }}>
                                        {categoryProduct.slice(3, 5).map((item) => (
                                            <TouchableOpacity onPress={() =>
                                                navigation.navigate('ProductDetails', { productId: item.id })}>
                                                <View key={`${item.id}`} style={[styles.card, { height: SMALL_HEIGHT }]}>
                                                    <Image source={{ uri: Image_url + item.side_image }} style={styles.imageSmall} />
                                                    <Text style={styles.title}>{item.name}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <Text>No data Found</Text>
                        </View>
                    )}
                </View>

                {/* FREQUENTLY BOUGHT */}
                <View style={{ paddingHorizontal: widthPercentageToDP(3), backgroundColor: '#fff', }}>
                    <Text style={styles.sectionTitle}>Frequently Bought</Text>

                    <FlatList
                        data={orderitem}
                        keyExtractor={(item) => String(item.id)}
                        horizontal
                        // columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
                        renderItem={(item) => {
                            //console.log('itemm', item?.item)
                            return (
                                <TouchableOpacity onPress={() =>
                                    navigation.navigate('ProductDetails', { productId: item?.item?.items[0]?.product?.front_image.id })}>
                                    <View style={styles.freqCard}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                            <Image source={{ uri: Image_url + item?.item?.items[0]?.product?.front_image }} style={styles.freqImage} />
                                            <View style={{ marginLeft: 5 }}></View>
                                            <Image source={{ uri: Image_url + item?.item?.items[0]?.product?.back_image }} style={styles.freqImage} />
                                        </View>
                                        <Text style={styles.freqText}>{item?.item?.items[0]?.product?.name}</Text>
                                    </View>
                                </TouchableOpacity>

                            )
                        }}
                    />

                    {/* FEATURED */}
                    <Text style={styles.sectionTitle}>Featured This Week</Text>

                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={FeaturesProduct}
                        keyExtractor={(item, index) => (item?.id ? String(item.id) : String(index))}
                        renderItem={({ item }) => {
                            //console.log('urlss', item?.product?.front_image)
                            return (
                                <TouchableOpacity onPress={() =>
                                    navigation.navigate('ProductDetails', { productId: item?.product?.id })}>
                                    <View style={styles.featuredCard}>
                                        <Image source={{ uri: Image_url + item?.product?.front_image }} style={styles.featuredImage} />
                                        {item.tag && (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>{item.tag}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>

                            );
                        }}
                    />

                </View>

                <View style={{ width: '100%', height: heightPercentageToDP(30), marginTop: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fecf5d' }}>
                    <Image source={require('../../assets/bg3x.png')} style={{ width: '100%', height: '100%' }} />

                    <View style={{ position: 'absolute', top: 10, alignItems: 'center' }}>
                        <Image source={require('../../assets/bigsales.png')} style={{ width: 75, height: 65 }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', marginTop: 15 }}>{formatDate(salesProduct[0]?.start_date).slice(0, 9)} - {formatDate(salesProduct[0]?.end_date).slice(0, 9)}</Text>
                        <FlatList
                            data={salesProduct}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, index) => String(index)}
                            renderItem={(item) => {
                                return (
                                    <TouchableOpacity onPress={() =>
                                        navigation.navigate('ProductDetails', { productId: item?.item?.product?.id })}>
                                        <View style={{ borderRadius: 8, alignItems: 'center', backgroundColor: '#FFEEBC', width: 100, height: 90, marginLeft: 10, marginTop: heightPercentageToDP(3) }}>
                                            <View style={{ backgroundColor: '#FFFFFF', width: 70, height: 17, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, justifyContent: 'center' }}>
                                                <Text style={{ fontSize: 8, fontWeight: '700', alignSelf: 'center', }}>Upto {item?.item?.percentage}% Off</Text>
                                            </View>
                                            <Image source={{ uri: Image_url + item?.item?.product?.front_image }} style={{ width: 60, height: 70, resizeMode: 'cover', marginTop: 5, borderRadius: 8 }} />
                                        </View>
                                    </TouchableOpacity>
                                )
                            }}
                        />
                    </View>
                </View>

                {/* Lowest Prices Ever - horizontal small cards */}
                <View style={{ width: '100%', height: heightPercentageToDP(35), marginTop: -5, justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={require('../../assets/Subtraction2.png')} style={{ width: '100%', height: '100%', }} />
                    <View style={{ position: 'absolute', top: 10, paddingHorizontal: widthPercentageToDP(3), }}>
                        <Text style={[styles.sectionTitle, { alignSelf: 'center' }]}>Lowest Prices Ever</Text>
                        <FlatList
                            data={lowestitem}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, index) => String(index)}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() =>
                                    navigation.navigate('ProductDetails', { productId: item.id })}>
                                    <View style={[styles.smallCard, { width: SMALL_CARD_WIDTH }]}>
                                        <Image source={{ uri: Image_url + item?.front_image }} style={styles.smallImage} />
                                        <Text numberOfLines={2} style={styles.smallTitle}>{item?.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                            <Text style={styles.smallPrice}>{Math.round(item?.variants[0]?.price)} €</Text>
                                            {item?.variants[0]?.price && <Text style={styles.smallOldPrice}>{Math.round(item?.variants[0]?.price)} €</Text>}
                                        </View>
                                        <View style={{ backgroundColor: '#EAE6B9', borderRadius: 4, marginVertical: 10, flexDirection: 'row', justifyContent: 'center', paddingVertical: 5, paddingHorizontal: 3 }}>
                                            <Text style={{ fontSize: 8, color: '#000' }}>see more like this  <Text style={{ color: '#008009' }}>▶</Text> </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity onPress={() => navigation.navigate('WishlistScreen')} >
                            <View
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 8,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    height: 40,
                                    width: widthPercentageToDP(90),
                                    alignSelf: 'center'
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
                                    style={{ width: 12, height: 12, alignSelf: 'center', left: 10, tintColor: '#000000' }}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Your Wishlist - horizontal scroll with slightly larger cards */}
                <View style={{ paddingHorizontal: widthPercentageToDP(3), marginTop: heightPercentageToDP(2) }}>
                    <Text style={styles.sectionTitle}>Your Wishlist</Text>
                    <FlatList
                        data={wishlistitem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() =>
                                navigation.navigate('ProductDetails', { productId: item.id })}>
                                <View style={[styles.wishlistCard, { width: WISHLIST_CARD_WIDTH }]}>
                                    <Image source={{ uri: Image_url + item?.front_image }} style={styles.wishlistImage} />
                                    <Text numberOfLines={2} style={[styles.wishlistTitle, { fontWeight: '400' }]}>{item?.name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                        <Text style={styles.smallPrice}>{Math.round(item?.variants[0]?.price)} €</Text>
                                        {item?.variants[0]?.price && <Text style={styles.smallOldPrice}>{Math.round(item?.variants[0]?.price)} €</Text>}
                                    </View>

                                    <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: Colors.button[100], padding: 6, borderRadius: 12, width: 20, height: 20, justifyContent: 'center' }}>
                                        <Image
                                            source={require('../../assets/Png/heart-1.png')}
                                            style={{ position: 'absolute', width: 12, height: 12, alignSelf: 'center' }}
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <PromotionalBanner promotional={Promotional} />


                {/* Recommended For You - horizontal with simple pagination */}
                <View style={{ paddingHorizontal: widthPercentageToDP(3), marginTop: heightPercentageToDP(2), marginBottom: heightPercentageToDP(4) }}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                    <FlatList
                        ref={recRef}
                        data={apiRecommend}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        snapToInterval={WISHLIST_CARD_WIDTH + 12}
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingVertical: 8 }}
                        onScroll={onRecommendedScroll}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() =>
                                navigation.navigate('ProductDetails', { productId: item.id })}>
                                <View style={[styles.wishlistCard, { width: WISHLIST_CARD_WIDTH }]}>
                                    <Image source={{ uri: Image_url + item?.front_image }} style={styles.wishlistImage} />
                                    <Text numberOfLines={2} style={[styles.wishlistTitle, { fontWeight: '400' }]}>{item?.name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                        <Text style={styles.smallPrice}>{item.main_price}</Text>
                                        {item.main_price && <Text style={styles.smallOldPrice}>{item.main_price}</Text>}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />

                    {/* Dots */}
                    <View style={styles.dotsContainer}>
                        {Array.isArray(apiRecommend) &&
                            apiRecommend.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        activeRec === i && styles.activeDot,
                                    ]}
                                />
                            ))}
                    </View>
                </View>

                {/* --- NEW SECTIONS END --- */}

            </ScrollView >
        </View >
    )
}

export default HomeScreen1;

const styles = StyleSheet.create({

    container: {
        marginVertical: 20,
    },

    row: {
        flexDirection: 'row',
        gap: 8,
    },

    stack: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: '65%'
    },

    card: {
        width: widthPercentageToDP(30),
        backgroundColor: '#F4F6C8',
        borderRadius: 14,
        padding: 8,
    },

    imageBig: {
        width: '100%',
        height: 120,
        resizeMode: 'contain',
    },

    imageSmall: {
        width: '100%',
        height: 60,
        resizeMode: 'contain',
    },

    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2E2E2E',
        width: '70%'
    },
    button: {
        width: '30%',
        backgroundColor: '#fff',
        borderRadius: 4,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        height: 30,
    },
    buttonText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '700',
    },
    grid: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    categoryCard: {
        backgroundColor: '#F1F4C3',
        width: CARD_WIDTH,
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
    },
    largeCard: {
        height: 240,
    },
    moveToWishlistText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000000',
    },
    categoryImage: {
        width: '100%',
        height: 90,
        resizeMode: 'contain',
        marginVertical: 8,
    },
    categoryTitle: {
        fontWeight: '700',
        fontSize: 14,
    },
    subtitle: {
        fontSize: 12,
        color: '#4CAF50',
    },
    imageBackground: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
    },

    page: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    oldPrice: {
        textDecorationLine: 'line-through',
        fontSize: 11,
        alignSelf: 'flex-end',
    },
    priceBadge: {
        backgroundColor: '#D4E157',
        paddingHorizontal: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    price: {
        fontWeight: '700',
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginVertical: heightPercentageToDP(1),
    },


    freqCard: {
        padding: 10,
        backgroundColor: '#F4F1E8',
        borderRadius: 10,
    },
    freqImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
        borderRadius: 12,
    },
    freqText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 6,
        fontWeight: '700',
        width: CARD_WIDTH - 30,
    },

    featuredCard: {
        width: 110,
        height: 130,
        borderRadius: 10,
        marginRight: 12,
        padding: 5,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#236FE3'
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    tag: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: '#8BC34A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        color: '#fff',
        fontSize: 11,
    },

    /* New small card styles */
    smallCard: {
        borderRadius: 8,
        padding: 8,
        marginRight: 10,
    },
    smallImage: {
        width: '100%',
        height: SMALL_CARD_WIDTH - 10,
        resizeMode: 'cover',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',

    },
    smallTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 6,
    },
    smallPrice: {
        fontWeight: '700',
        fontSize: 14,
        color: '#333'
    },
    smallOldPrice: {
        textDecorationLine: 'line-through',
        color: '#999',
        marginLeft: 8,
        fontSize: 12,
    },

    /* Wishlist / recommended cards */
    wishlistCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 8,
        marginRight: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        alignItems: 'flex-start',
    },
    wishlistImage: {
        width: '100%',
        height: WISHLIST_CARD_WIDTH - 36,
        resizeMode: 'cover',
        borderRadius: 8,
    },
    wishlistTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
    },

    /* Pagination dots */
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 6,
        backgroundColor: '#DDD',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#AEB254',
        width: 30,
        height: 6,
        borderRadius: 6
    },
});