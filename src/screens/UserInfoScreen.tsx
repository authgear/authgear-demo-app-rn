import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Appbar, Divider, Text, useTheme} from 'react-native-paper';
import {RootStackParamList} from '../App';
import {useUserInfo} from '../context/UserInfoProvider';

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'column',
    marginVertical: 8,
  },
  itemLabelText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  itemValueText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  container: {
    marginLeft: 16,
  },
});

interface UserInfoItemProps {
  label: string;
  value?: string;
}

const UserInfoItem: React.FC<UserInfoItemProps> = props => {
  const theme = useTheme();

  return (
    <View style={styles.itemContainer}>
      <Text style={styles.itemLabelText}>{props.label}</Text>
      <Text style={{...styles.itemValueText, color: theme.colors.disabled}}>
        {props.value ?? ''}
      </Text>
    </View>
  );
};

interface UserInfoListProps {
  list: {label: string; value?: string}[];
}

const UserInfoList: React.FC<UserInfoListProps> = props => {
  const list = props.list;

  return (
    <ScrollView style={styles.container}>
      {list.map(item => (
        <>
          <UserInfoItem label={item.label} value={item.value} />
          <Divider />
        </>
      ))}
    </ScrollView>
  );
};

type UserInfoScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'UserInfo'
>;

const UserInfoScreen: React.FC<UserInfoScreenProps> = props => {
  const navigation = props.navigation;
  const {userInfo} = useUserInfo();

  const userInfoList = [
    {
      label: 'id',
      value: userInfo?.sub,
    },
    {
      label: 'created_at',
    },
    {
      label: 'is_anonymous',
      value: userInfo?.isAnonymous.toString(),
    },
    {
      label: 'is_deactivated',
    },
    {
      label: 'is_disabled',
    },
    {
      label: 'is_verified',
      value: userInfo?.isVerified.toString(),
    },
    {
      label: 'last_login_at',
    },
    {
      label: 'standard_attributes.email',
      value: userInfo?.email,
    },
    {
      label: 'standard_attributes.email_verified',
      value: userInfo?.emailVerified?.toString(),
    },
    {
      label: 'standard_attributes.name',
      value: userInfo?.phoneNumber,
    },
    {
      label: 'standard_attributes.phone_number',
      value: userInfo?.phoneNumberVerified?.toString(),
    },
  ];

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="User Information" />
      </Appbar.Header>

      <UserInfoList list={userInfoList} />
    </>
  );
};

export default UserInfoScreen;
