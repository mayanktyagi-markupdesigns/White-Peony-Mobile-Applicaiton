import { View, Text, StatusBar, Image, FlatList, Dimensions, StyleSheet, ScrollView, Platform, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native'
import React, { useRef, useState } from 'react'
import { heightPercentageToDP, widthPercentageToDP } from '../../constant/dimentions';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const SMALL_CARD_WIDTH = Math.round(width * 0.30);
const WISHLIST_CARD_WIDTH = Math.round(width * 0.35);

const GAP = 12;
const CARD_WIDTH1 = (width - 100) / 2;
const SMALL_HEIGHT = 120;
const BIG_HEIGHT = SMALL_HEIGHT * 2 + GAP;

const data = [
    { id: '1', title: 'All Around Matcha', image: require('../../assets/Motcha.png'), featured: true },
    { id: '2', title: 'Pure Herbs & Spices', image: require('../../assets/Motcha.png') },
    { id: '3', title: 'Immunity Teas', image: require('../../assets/Motcha.png') },
    { id: '4', title: 'Green Tea', image: require('../../assets/Motcha.png') },
];

const frequentlyBought = [
    { id: '1', title: 'Favorites', image: require('../../assets/Ellipse.png') },
    { id: '2', title: 'Maple Queen Oolong', image: require('../../assets/Ellipse.png') },
    { id: '3', title: 'Blue Matcha Butterfly Pea', image: require('../../assets/Ellipse.png') },
    { id: '4', title: 'Favorites', image: require('../../assets/Ellipse.png') },
    { id: '5', title: 'Maple Queen Oolong', image: require('../../assets/Ellipse.png') },
    { id: '6', title: 'Blue Matcha Butterfly Pea', image: require('../../assets/Ellipse.png') },
];

const featured = [
    { id: '1', image: require('../../assets/close3x.png'), tag: 'For You' },
    { id: '2', image: require('../../assets/close3x.png') },
    { id: '3', image: require('../../assets/close3x.png') },
];

// New demo data for added sections
const lowestPrices = [
    { id: 'lp1', title: 'Maple Queen Oolong', price: '24 €', oldPrice: '34 €', image: require('../../assets/Rectangle-.png') },
    { id: 'lp2', title: 'Green Matcha', price: '24 €', oldPrice: '34 €', image: require('../../assets/Rectangle-.png') },
    { id: 'lp3', title: 'Herbal Mix', price: '24 €', oldPrice: '34 €', image: require('../../assets/Rectangle-.png') },
    { id: 'lp4', title: 'Blue Tea', price: '24 €', oldPrice: '34 €', image: require('../../assets/Rectangle-.png') },
];

const wishlist = [
    { id: 'wl1', title: 'Maple Queen', image: require('../../assets/Rectangle-.png'), price: '24 €', oldPrice: '34 €', },
    { id: 'wl2', title: 'Matcha Powder', image: require('../../assets/Rectangle-.png'), price: '24 €', oldPrice: '34 €', },
    { id: 'wl3', title: 'Oolong Tea', image: require('../../assets/Rectangle-.png'), price: '24 €', oldPrice: '34 €', },
];

const recommended = [
    { id: 'r1', title: 'Recommended 1', price: '24 €', oldPrice: '34 €', image: require('../../assets/Rectangle-.png') },
    { id: 'r2', title: 'Recommended 2', price: '24 €', oldPrice: '34 €', image: require('../../assets/Rectangle-.png') },
    { id: 'r3', title: 'Recommended 3', price: '24 €', oldPrice: '34 €', image: require('../../assets/Rectangle-.png') },
];

const HomeScreen1 = ({ navigation }: any) => {

    const topPadding = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
    const [activeRec, setActiveRec] = useState(0);
    const recRef = useRef<FlatList<any>>(null);

    const onRecommendedScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (WISHLIST_CARD_WIDTH + 12));
        setActiveRec(index);
    };

    return (
        <View style={{ flex: 1, marginTop: topPadding, }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#fff', }}  >

                <View style={{ backgroundColor: '#FFFFF0', paddingHorizontal: widthPercentageToDP(3) }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: heightPercentageToDP(3) }}>
                        <View />
                        <Image source={require('../../assets/peony_logo.png')} style={{ width: 140, height: 25, resizeMode: 'contain' }} />
                        <View style={{ borderColor: '#A7A7A7', borderWidth: 1, borderRadius: 20, padding: 5, marginRight: 10 }}>
                            <Image source={require('../../assets/userx.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderColor: '#A7A7A7', borderWidth: 1, borderRadius: 30, height: 50 }}>
                        <Image source={require('../../assets/Searchx.png')} style={{ width: 20, height: 20, resizeMode: 'contain', marginLeft: 10, alignSelf: 'center' }} />
                        <Text style={{ alignSelf: 'center', color: '#A7A7A7', fontSize: 16, flex: 1, marginLeft: 10 }}>Search "Products"</Text>
                        <View style={{ borderWidth: 1, borderColor: '#A7A7A7', marginVertical: 8, right: 10 }} />
                        <Image source={require('../../assets/micx.png')} style={{ width: 20, height: 20, resizeMode: 'contain', marginRight: 10, alignSelf: 'center' }} />
                    </View>

                    <View style={{ marginVertical: heightPercentageToDP(2), flexDirection: 'row', alignItems: "center" }}>
                        <FlatList
                            data={['a', 's', 'd', 'f', 'g', 'h']}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, index) => String(index)}
                            renderItem={() => {
                                return (
                                    <View style={{ flexDirection: 'column', alignItems: 'center', marginHorizontal: 10 }}>
                                        <Image source={require('../../assets/matcha-tea.png')} style={{ width: 25, height: 25, resizeMode: "contain" }} />
                                        <Text style={{ fontWeight: '700', fontSize: 12, marginTop: heightPercentageToDP(1) }}>BIO Teas</Text>
                                    </View>
                                )
                            }}
                        />
                    </View>
                    <View style={{ borderWidth: 0.7, borderColor: '#A7A7A7', width: widthPercentageToDP(95) }} />

                    {/* Categories as 2-column grid */}
                    <View style={styles.container}>
                        <View style={styles.row}>
                            {/* BIG CARD */}
                            <View style={[styles.card, { height: BIG_HEIGHT }]}>
                                <Image source={data[0].image} style={styles.imageBig} />
                                <Text style={styles.title}>{data[0].title}</Text>
                            </View>

                            {/* RIGHT STACK */}
                            <View style={styles.stack}>
                                {data.slice(1, 3).map((item) => (
                                    <View style={{ flexDirection: "row", justifyContent:'space-between',  }}>
                                        <View key={item.id} style={[styles.card, { height: SMALL_HEIGHT }]}>
                                            <Image source={item.image} style={styles.imageSmall} />
                                            <Text style={styles.title}>{item.title}</Text>
                                        </View>
                                        <View key={item.id} style={[styles.card, { height: SMALL_HEIGHT, left: 5 }]}>
                                            <Image source={item.image} style={styles.imageSmall} />
                                            <Text style={styles.title}>{item.title}</Text>
                                        </View>
                                    </View>


                                ))}
                            </View>
                        </View>
                    </View>
                    {/* <FlatList
                        data={categories}
                        numColumns={2}
                        keyExtractor={item => item.id}
                        columnWrapperStyle={{ justifyContent: 'space-between', marginTop: heightPercentageToDP(2), paddingHorizontal: 0 }}
                        contentContainerStyle={{ paddingHorizontal: widthPercentageToDP(3), paddingBottom: 8 }}
                        renderItem={({ item }) => (
                            <View style={[styles.categoryCard, item.large && styles.largeCard]}>
                                {item.oldPrice && (
                                    <Text style={styles.oldPrice}>{item.oldPrice}</Text>
                                )}
                                {item.price && (
                                    <View style={styles.priceBadge}>
                                        <Text style={styles.price}>{item.price}</Text>
                                    </View>
                                )}
                                <Image source={item.image} style={styles.categoryImage} />
                                <Text style={styles.categoryTitle}>{item.title}</Text>
                                {item.subtitle && (
                                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                                )}
                            </View>
                        )}
                    /> */}

                </View>

                {/* FREQUENTLY BOUGHT */}
                <View style={{ paddingHorizontal: widthPercentageToDP(3), backgroundColor: '#fff', }}>
                    <Text style={styles.sectionTitle}>Frequently Bought</Text>

                    <FlatList
                        data={frequentlyBought}
                        numColumns={2}
                        keyExtractor={item => item.id}
                        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
                        renderItem={({ item }) => (
                            <View style={styles.freqCard}>
                                <View style={{ flexDirection: 'row', }}>
                                    <Image source={item.image} style={styles.freqImage} />
                                    <View style={{ marginLeft: 5 }}></View>
                                    <Image source={item.image} style={styles.freqImage} />
                                </View>
                                <Text style={styles.freqText}>{item.title}</Text>
                            </View>
                        )}
                    />

                    {/* FEATURED */}
                    <Text style={styles.sectionTitle}>Featured This Week</Text>

                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={featured}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.featuredCard}>
                                <Image source={item.image} style={styles.featuredImage} />
                                {item.tag && (
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{item.tag}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    />

                </View>

                <View style={{ width: '100%', height: heightPercentageToDP(30), marginTop: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fecf5d' }}>
                    <Image source={require('../../assets/bg3x.png')} style={{ width: '100%', height: '100%' }} />

                    <View style={{ position: 'absolute', top: 10, alignItems: 'center' }}>
                        <Image source={require('../../assets/bigsales.png')} style={{ width: 75, height: 65 }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', marginTop: 15 }}>1 JAN, 2026 - 8 JAN, 2026</Text>
                        <FlatList
                            data={['a', 'b', 'c', 'd']}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, index) => String(index)}
                            renderItem={() => {
                                return (
                                    <View style={{ borderRadius: 8, alignItems: 'center', backgroundColor: '#FFEEBC', width: 100, height: 90, marginLeft: 10, marginTop: heightPercentageToDP(3) }}>
                                        <View style={{ backgroundColor: '#FFFFFF', width: 70, height: 17, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, justifyContent: 'center' }}>
                                            <Text style={{ fontSize: 8, fontWeight: '700', alignSelf: 'center', }}>Upto 15% Off</Text>
                                        </View>
                                        <Image source={require('../../assets/Rectangle-.png')} style={{ width: 60, height: 70, resizeMode: "contain", marginTop: 5 }} />
                                    </View>
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
                            data={lowestPrices}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={[styles.smallCard, { width: SMALL_CARD_WIDTH }]}>
                                    <Image source={item.image} style={styles.smallImage} />
                                    <Text numberOfLines={2} style={styles.smallTitle}>{item.title}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                        <Text style={styles.smallPrice}>{item.price}</Text>
                                        {item.oldPrice && <Text style={styles.smallOldPrice}>{item.oldPrice}</Text>}
                                    </View>
                                    <View style={{ backgroundColor: '#EAE6B9', borderRadius: 4, marginVertical: 10, flexDirection: 'row', justifyContent: 'center', paddingVertical: 5, paddingHorizontal: 3 }}>
                                        <Text style={{ fontSize: 8, color: '#000' }}>see more like this  <Text style={{ color: '#008009' }}>▶</Text> </Text>
                                    </View>
                                </View>
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
                        data={wishlist}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        renderItem={({ item }) => (
                            <View style={[styles.wishlistCard, { width: WISHLIST_CARD_WIDTH }]}>
                                <Image source={item.image} style={styles.wishlistImage} />
                                <Text numberOfLines={2} style={[styles.wishlistTitle, { fontWeight: '400' }]}>{item.title}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                    <Text style={styles.smallPrice}>{item.price}</Text>
                                    {item.oldPrice && <Text style={styles.smallOldPrice}>{item.oldPrice}</Text>}
                                </View>

                                <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#E2E689', padding: 6, borderRadius: 12, width: 20, height: 20, justifyContent: 'center' }}>
                                    <Image
                                        source={require('../../assets/Png/heart-1.png')}
                                        style={{ position: 'absolute', width: 12, height: 12, alignSelf: 'center' }}
                                    />
                                </View>
                            </View>
                        )}
                    />
                </View>

                {/* Recommended For You - horizontal with simple pagination */}
                <View style={{ paddingHorizontal: widthPercentageToDP(3), marginTop: heightPercentageToDP(2), marginBottom: heightPercentageToDP(4) }}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                    <FlatList
                        ref={recRef}
                        data={recommended}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        snapToInterval={WISHLIST_CARD_WIDTH + 12}
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingVertical: 8 }}
                        onScroll={onRecommendedScroll}
                        renderItem={({ item }) => (
                            <View style={[styles.wishlistCard, { width: WISHLIST_CARD_WIDTH }]}>
                                <Image source={item.image} style={styles.wishlistImage} />
                                <Text numberOfLines={2} style={[styles.wishlistTitle, { fontWeight: '400' }]}>{item.title}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                    <Text style={styles.smallPrice}>{item.price}</Text>
                                    {item.oldPrice && <Text style={styles.smallOldPrice}>{item.oldPrice}</Text>}
                                </View>
                            </View>
                        )}
                    />

                    {/* Dots */}
                    <View style={styles.dotsContainer}>
                        {recommended.map((_, i) => (
                            <View key={i} style={[styles.dot, activeRec === i && styles.activeDot]} />
                        ))}
                    </View>
                </View>

                {/* --- NEW SECTIONS END --- */}



            </ScrollView>
        </View>
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
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2E2E2E',
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
        borderRadius: 10
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