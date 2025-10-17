import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react';
import { UserService } from '../../service/ApiService';
import Toast from 'react-native-toast-message';
import { CommonLoader } from '../../components/CommonLoader/commonLoader';
import RenderHTML from 'react-native-render-html';


const Slugs = ({ navigation, route }) => {
    const { showLoader, hideLoader } = CommonLoader();
    const { width } = useWindowDimensions();
    const name = route.params.slug;
    const [html, sethtml] = useState(null)


    useEffect(() => {
        console.log("params", name)
        Slug();
    }, [name])

    const Slug = async () => {
        try {
            showLoader();
            const res = await UserService.SlugAPI(name);
            const Getslugs = res?.data?.data?.content || {};
            sethtml(Getslugs);
            console.log("slugs", Getslugs)

        } catch (e) {
            console.error('slugs fetch error:', e);
            Toast.show({ type: 'error', text1: 'Failed to load wishlist' });
        } finally {
            hideLoader();
        }
    };


    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            <View style={{ marginBottom: 12 }}>
                <View style={{ backgroundColor: '#FFFFF0', height: 160 }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{name}</Text>
                    </View>
                </View>
            </View>

            <RenderHTML
                contentWidth={width - 32} // account for padding
                source={{ html }}
                enableExperimentalMarginCollapsing={true}
                tagsStyles={{
                    p: { marginBottom: 12, lineHeight: 20, color: '#222', fontSize: 15 },
                    strong: { fontWeight: '700' },
                    a: { color: '#1e88e5' },
                }}
                defaultTextProps={{ selectable: true }} // allow text selection/copy
                
            />
        </ScrollView>

    )
}

export default Slugs;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    headerTitle: { fontSize: 18, fontWeight: '600' },
})