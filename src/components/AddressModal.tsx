// components/AddressModal.tsx
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TouchableWithoutFeedback,
    Image,
    Alert,
} from "react-native";
import { CommonLoader } from "./CommonLoader/commonLoader";
import { UserService } from "../service/ApiService";
import { HttpStatusCode } from "axios";
import Toast from "react-native-toast-message";
import AddressDetailModal from "./AddressDetailModal";

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

type AddressModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelect?: (address: Address) => void;
    onAddNew?: () => void;
};

const AddressModal: React.FC<AddressModalProps> = ({
    visible,
    onClose,
    onSelect,
    onAddNew,
}) => {
    const { showLoader, hideLoader } = CommonLoader();
    const [addressList, setAddressList] = useState<Address[]>([]);
    const [showAddressDetail, setShowAddressDetail] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            if (visible) {
                Addresses().then(() => {
                    if (!isActive) return;
                     Addresses();
                });
            }

            return () => {
                isActive = false;
            };
        }, [visible])
    );

    const Addresses = async () => {
        try {
            showLoader();
            const res = await UserService.address();
            hideLoader();
            if (res?.status === HttpStatusCode.Ok && res?.data) {
                const { message, addresses } = res.data;
                Toast.show({ type: "success", text1: message });
                setAddressList(addresses || []);
            } else {
                Toast.show({
                    type: "error",
                    text1: res?.data?.message || "Something went wrong!",
                });
            }
        } catch (err: any) {
            hideLoader();
            console.log("Error in Addresses:", JSON.stringify(err));
            Toast.show({
                type: "error",
                text1: err?.response?.data?.message || "Something went wrong! Please try again.",
            });
        }
    };

    const handleAddressSelect = (address: Address | null) => {
        console.log("Selected address:", address);
        if (address) {
            // Selecting an existing address → return to parent and close
            onSelect && onSelect(address);
            onClose && onClose();
            return;
        }
        // Add New flow → open details modal
        setSelectedAddress(address);
        setShowAddressDetail(true);
    };


    const DeleteAlert = async (id) => {
        Alert.alert('White Peony', 'Are you sure you want to Delete Address?', [
            {
                text: 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            {
                text: 'OK', onPress: () => {
                    DeleteAddres(id);
                }
            },
        ]);
    };


    const DeleteAddres = async (id: number) => {
        try {
            showLoader();
            const res = await UserService.deleteaddresses(id);
            hideLoader();

            if (res && res.data && res.status === HttpStatusCode.Ok) {
                Toast.show({
                    type: 'success',
                    text1: res.data?.message || 'Cart updated!',
                });
                Addresses();
            } else {
                console.log("addresserror", res?.data)
                Toast.show({ type: 'error', text1: 'Failed to update cart' });
            }
        } catch (err: any) {
            console.log("addresserror", JSON.stringify(err))
            hideLoader();
            Toast.show({
                type: 'error',
                text1:
                    err?.response?.data?.message ||
                    'Something went wrong! Please try again.',
            });
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.header}>Select Address</Text>

                        <TouchableOpacity style={styles.addButton} onPress={() => handleAddressSelect(null)}>
                            <Text style={styles.addText}>➕ Add New Address</Text>
                        </TouchableOpacity>

                        <ScrollView style={{ maxHeight: 300, marginTop: 15 }}>
                            {addressList && addressList.length > 0 ? (
                                addressList.map((addr) => (
                                    <TouchableOpacity
                                        key={addr.id}
                                        style={styles.addressCard}
                                        onLongPress={() => {
                                            setSelectedAddress(addr);
                                            setShowAddressDetail(true);
                                        }}
                                        onPress={() => handleAddressSelect(addr)} // ✅ Send address to parent
                                    >
                                        <View style={{ marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={styles.addressLabel}>{addr.address_type}</Text>
                                            <TouchableOpacity onPress={() => DeleteAlert(addr.id)}>
                                                <Image source={require('../assets/Png/delete.png')} style={{ width: 20, height: 20 }} />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.addressName}>{addr.name}</Text>
                                        <Text style={styles.addressLine}>{addr.full_address}</Text>
                                        <Text style={styles.addressLine}>{addr.phone}</Text>
                                        <Text style={styles.addressLine}>{addr.postal_code}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View
                                    style={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 200,
                                    }}
                                >
                                    <Text style={{ color: '#999', fontSize: 16 }}>No data found</Text>
                                </View>
                            )}
                        </ScrollView>

                        <AddressDetailModal
                            isVisible={showAddressDetail}
                            onClose={() => setShowAddressDetail(false)}
                            addresses={selectedAddress}
                            onAddressUpdated={Addresses}
                        />

                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};


export default AddressModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    modalContainer: {
        backgroundColor: '#fff', borderTopLeftRadius: 16, borderRadius: 27, padding: 16, maxHeight: '90%', width: '95%', alignSelf: 'center', bottom: 20

    },
    header: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 15,
        textAlign: "center",
    },
    addButton: {
        borderWidth: 1,
        borderColor: "#C9C9C9",
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
    },
    addText: {
        color: "#6B8E23",
        fontWeight: "600",
    },
    addressCard: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B8E23",
    },
    addressName: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 3,
    },
    addressLine: {
        fontSize: 14,
        color: "#555",
    },
    closeButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    closeText: {
        color: "#fff",
        fontWeight: "600",
        textAlign: "center",
    },
});
