import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { UserService } from '../../service/ApiService';
import { WishlistContext } from '../../context/wishlistContext';
import Toast from 'react-native-toast-message';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import { UserData, UserDataContext } from '../../context/userDataContext';
import { HttpStatusCode } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WishlistApiItem = {
    wishlist_item_id: string;
    product_id: string;
    name: string;
    description?: string;
    front_image?: string;
    back_image?: string;
    side_image?: string;
    is_cart?: string;
    stock_quantity?: string;
    product_price?: string;
};

type DisplayWishlistItem = {
    id: string; // product id
    wishlistItemId: string;
    name: string;
    price: string;
    image: string | null;
};

const WishlistScreen = ({ navigation }: { navigation: any }) => {
    const { removeFromWishlist, wishlistIds } = React.useContext(WishlistContext);
    const [items, setItems] = useState<DisplayWishlistItem[]>([]);
    const { isLoggedIn } = useContext<UserData>(UserDataContext);
    const { showLoader, hideLoader } = CommonLoader();

    useEffect(() => {
        loadWishlistItems();
    }, [isLoggedIn, wishlistIds]);

    const loadWishlistItems = async () => {
        if (isLoggedIn) {
            // Fetch from server for logged-in users
            await fetchServerWishlist();
        } else {
            // Load from local storage for guests
            await loadLocalWishlist();
        }
    };

    const fetchServerWishlist = async () => {
        try {
            showLoader();
            const res = await UserService.wishlist();
            const apiWishlist = res?.data?.wishlist;
            const baseUrl = res?.data?.base_url || 'https://www.markupdesigns.net/whitepeony/storage/';
            const apiItems: WishlistApiItem[] = Array.isArray(apiWishlist?.items) ? apiWishlist.items : [];
            
            const mapped: DisplayWishlistItem[] = apiItems.map((w) => {
                const firstImage = w.front_image || w.back_image || w.side_image || '';
                const image = firstImage
                    ? (firstImage.startsWith('http') ? firstImage : `${baseUrl}${firstImage}`)
                    : null;
                return {
                    id: String(w.product_id),
                    wishlistItemId: String(w.wishlist_item_id),
                    name: w.name,
                    price: w.product_price ? `${w.product_price} €` : '',
                    image,
                };
            });
            setItems(mapped);
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Failed to load wishlist' });
        } finally {
            hideLoader();
        }
    };

    const loadLocalWishlist = async () => {
        try {
            showLoader();
            // Get local wishlist items from context or storage
            const localItems = wishlistIds || [];

            console.log("localwishlist", localItems);
            
            // Transform local items to match display format
            const mapped: DisplayWishlistItem[] = localItems.map(id => ({
                id: String(id),
                wishlistItemId: String(id),
                name: `Product ${id}`, // You might want to store more product details locally
                price: '0 €',
                image: null, // You might want to store image URLs locally too
            }));
            
            setItems(mapped);
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Failed to load local wishlist' });
        } finally {
            hideLoader();
        }
    };

    const handleRemove = async (productId: string) => {
        try {
            showLoader();
            if (isLoggedIn) {
                // Remove from server for logged-in users
                const res = await UserService.wishlistDelete(productId);
                if (res?.status === HttpStatusCode.Ok) {
                    setItems(prev => prev.filter(i => i.id !== productId));
                    await removeFromWishlist(productId);
                    Toast.show({
                        type: 'success',
                        text1: 'Removed from wishlist'
                    });
                } else {
                    Toast.show({
                        type: 'error',
                        text1: res?.data?.message || 'Failed to remove from wishlist'
                    });
                }
            } else {
                // Remove locally for guests
                await removeFromWishlist(productId);
                setItems(prev => prev.filter(i => i.id !== productId));
                Toast.show({
                    type: 'success',
                    text1: 'Removed from wishlist'
                });
            }
        } catch (err) {
            console.log('Wishlist remove error:', JSON.stringify(err));
            Toast.show({
                type: 'error',
                text1: 'Failed to remove from wishlist'
            });
        } finally {
            hideLoader();
        }
    };

    const renderItem = ({ item }: { item: DisplayWishlistItem }) => (
        <View style={styles.card}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImage} />
            ) : (
                <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
            )}
            <View style={styles.details}>
                <Text style={styles.productName}>{item.name}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    {[1, 2, 3, 4, 5].map(r => (
                        <View key={r}>
                            <Text style={{ color: '#F0C419', fontSize: 24 }}>★</Text>
                        </View>
                    ))}
                </View>
                {/* <Text style={styles.price}>{item.price}</Text> */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.addToBagBtn} activeOpacity={0.7}>
                        <Image source={require('../../assets/Png/bag.png')} style={{ width: 16, height: 16, marginRight: 5 }} />
                        <Text style={styles.addToBagText}> Add To Bag</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.favoriteBtn} activeOpacity={0.7} onPress={() => handleRemove(item.id)}>
                        <Image source={require('../../assets/Png/heart1.png')} style={{ width: 16, height: 16 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.safeArea}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerButton}>
                    <Image source={require('../../assets/Png/back.png')} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wishlist</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <Image source={require('../../assets/Png/bag.png')} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
            </View>

            {/* Collection label */}
            <View style={styles.collectionLabel}>
                <Image source={require('../../assets/Png/star-fill.png')} style={{ width: 20, height: 20 }} />
                <Text style={styles.collectionLabelText}> My Collection ({items.length})</Text>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
        top: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        justifyContent: 'space-between',
    },
    headerButton: {
        padding: 4,
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
    },
    collectionLabel: {
        marginHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    collectionLabelText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#444',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 14,
        marginVertical: 8,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
    },
    productImage: {
        width: 72,
        height: 72,
        borderRadius: 18,
        marginRight: 16,
        resizeMode: 'cover',
    },
    details: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
    },
    price: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    actionsRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    addToBagBtn: {
        flexDirection: 'row',
        backgroundColor: '#DEE9A0',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: 'center',
        marginRight: 12,
    },
    addToBagText: {
        fontWeight: '600',
        fontSize: 12,
        color: '#5E6935',
    },
    favoriteBtn: {
        padding: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFD56C',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default WishlistScreen;