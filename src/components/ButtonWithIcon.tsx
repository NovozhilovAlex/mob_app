import React from "react";
import {Image, Text, TouchableOpacity} from "react-native";

export default function ButtonWithIcon(props: { title: string, icon: any, iconSize: number, onPress: () => Promise<void> }) {
    return <TouchableOpacity
        onPress={props.onPress}
    style={{
            marginHorizontal: 0,
            paddingVertical: 0,
            minHeight: 40,
            paddingHorizontal: 28,
            borderRadius: 20,
            backgroundColor: "#fff",
            shadowColor: "#000000",
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
    }}
>

        <Image
            source={props.icon}
            style={{
                width: props.iconSize,
                height: props.iconSize,
                marginRight: 10,
                tintColor: "#000",
            }}
        resizeMode="contain"
        />
        <Text style={{
            color: "#000",
            fontSize: 12,
            textAlign:'center',
            fontWeight: "600"
        }}>
            {props.title}
        </Text>
    </TouchableOpacity>;
}