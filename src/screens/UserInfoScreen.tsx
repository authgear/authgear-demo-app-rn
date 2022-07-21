import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Divider, Text, useTheme } from 'react-native-paper';
import { RootStackParamList } from '../App';
import authgear from '@authgear/react-native';

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

const UserInfoItem: React.FC<UserInfoItemProps> = (props) => {
  const theme = useTheme();

  return (
    <View style={styles.itemContainer}>
      <Text style={styles.itemLabelText}>{props.label}</Text>
      <Text style={{ ...styles.itemValueText, color: theme.colors.disabled }}>
        {props.value ?? ''}
      </Text>
    </View>
  );
};

interface UserInfoListProps {
  list: { label: string; value?: string }[];
}

const UserInfoList: React.FC<UserInfoListProps> = (props) => {
  const list = props.list;

  return (
    <ScrollView style={styles.container}>
      {list.map((item) => (
        <>
          <UserInfoItem
            key={item.label + '_item'}
            label={item.label}
            value={item.value}
          />
          <Divider key={item.label + '_divider'} />
        </>
      ))}
    </ScrollView>
  );
};

type UserInfoScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'UserInfo'
>;

const UserInfoScreen: React.FC<UserInfoScreenProps> = (props) => {
  const navigation = props.navigation;
  const userInfo = props.route.params?.userInfo;

  const userInfoList = useMemo(
    () => [
      {
        label: 'id',
        value: userInfo?.sub,
      },
      {
        label: 'is_verified',
        value: userInfo?.isVerified.toString(),
      },
      {
        label: 'is_anonymous',
        value: userInfo?.isAnonymous.toString(),
      },
      {
        label: 'can_reauthenticate',
        value: userInfo?.canReauthenticate.toString(),
      },
      {
        label: 'last_login_at',
        value: authgear.getAuthTime()?.toISOString(),
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
        label: 'standard_attributes.phone_number',
        value: userInfo?.phoneNumber,
      },
      {
        label: 'standard_attributes.phone_number_verified',
        value: userInfo?.phoneNumberVerified?.toString(),
      },
      {
        label: 'standard_attributes.preferred_username',
        value: userInfo?.preferredUsername,
      },
      {
        label: 'standard_attributes.family_name',
        value: userInfo?.familyName,
      },
      {
        label: 'standard_attributes.given_name',
        value: userInfo?.givenName,
      },
      {
        label: 'standard_attributes.middle_name',
        value: userInfo?.middleName,
      },
      {
        label: 'standard_attributes.name',
        value: userInfo?.name,
      },
      {
        label: 'standard_attributes.nickname',
        value: userInfo?.nickname,
      },
      {
        label: 'standard_attributes.picture',
        value: userInfo?.picture,
      },
      {
        label: 'standard_attributes.profile',
        value: userInfo?.profile,
      },
      {
        label: 'standard_attributes.website',
        value: userInfo?.website,
      },
      {
        label: 'standard_attributes.gender',
        value: userInfo?.gender,
      },
      {
        label: 'standard_attributes.birthdate',
        value: userInfo?.birthdate,
      },
      {
        label: 'standard_attributes.zoneinfo',
        value: userInfo?.zoneinfo,
      },
      {
        label: 'standard_attributes.locale',
        value: userInfo?.locale,
      },
      {
        label: 'standard_attributes.address.formatted',
        value: userInfo?.address?.formatted,
      },
      {
        label: 'standard_attributes.address.street_address',
        value: userInfo?.address?.streetAddress,
      },
      {
        label: 'standard_attributes.address.locality',
        value: userInfo?.address?.locality,
      },
      {
        label: 'standard_attributes.address.region',
        value: userInfo?.address?.region,
      },
      {
        label: 'standard_attributes.address.postal_code',
        value: userInfo?.address?.postalCode,
      },
      {
        label: 'standard_attributes.address.country',
        value: userInfo?.address?.country,
      },
    ],
    [userInfo]
  );

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
