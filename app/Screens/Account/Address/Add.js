import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import * as yup from 'yup';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';
import { GlobalStyleSheet } from '../../../constants/StyleSheet';
import { COLORS, FONTS } from '../../../constants/theme';
import Header from '../../../layout/Header';
import CustomButton from '../../../components/CustomButton';
import Input from '../../../components/InputComponent';
import InputTextArea from '../../../components/InputTextArea';

import { CountriesApi } from '../../../service/shopify-api';
import AsyncSelectComponent from '../../../components/SelectAsyncComponent';
import { CREATE_ADDRESS } from '../../../graphql/mutation';

const schema = yup.object().shape({
  first_name: yup.string().required(),
  last_name: yup.string().required(),
  phone_number: yup.string().required(),
  company: yup.string().required(),
  first_address: yup.string().required(),
  second_address: yup.string().required(),
  country: yup.string().required(),
  province: yup.string().required(),
  city: yup.string().required(),
  postal_code: yup.string().required(),
});

function AddDeliveryAddress({ navigation }) {
  const { customerInfo, getToken } = useSelector(state => state.user);
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countryId, setCountryId] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [state, setState] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    company: '',
    first_address: '',
    second_address: '',
    country: '',
    province: '',
    city: '',
    postal_code: '',
  });
  const [customerAddressCreate] = useMutation(CREATE_ADDRESS);

  useEffect(() => {
    setIsLoading(true);
    if (countryId !== '') {
      CountriesApi.getProvinceByCountryId(countryId)
        .then(result => {
          setProvinces(
            result.provinces.map(d => ({
              label: d.name,
              value: d.id,
            }))
          );
          setIsLoading(false);
          setCountryId('');
        })
        .catch(err => {
          Toast.show({
            type: 'error',
            text1: 'Oops!',
            text2: err?.originalError?.message || err?.message || 'something went wrong',
          });
          setIsLoading(false);
        });
    } else {
      CountriesApi.get()
        .then(res => {
          setCountries(
            res?.countries?.map(i => ({
              label: i.name,
              value: i.id,
            }))
          );
          setIsLoading(false);
        })
        .catch(err => {
          Toast.show({
            type: 'error',
            text1: 'Oops!',
            text2: err?.originalError?.message || 'something went wrong',
          });
          setIsLoading(false);
        });
    }
  }, [countryId]);

  const handleFieldChange = (value, name) => {
    setState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeCountry = (value, name) => {
    if (name === 'country') {
      setCountryId(value.value);
    }
  };

  const handleSubmit = () => {
    let refetch;
    setIsLoading(true);

    const body = {
      first_name: state.first_name,
      last_name: state.last_name,
      phone_number: state.phone_number || 0,
      company: state.company,
      first_address: state.first_address,
      second_address: state.second_address,
      country: state.country,
      province: state.province,
      city: state.city,
      postal_code: state.postal_code || 0,
    };
    schema
      .validate(body, { abortEarly: false })
      .then(async result => {
        const { error, data } = await customerAddressCreate({
          variables: {
            address: {
              address1: result.first_address,
              address2: result.second_address,
              phone: result.phone_number,
              city: result.city,
              province: result.province,
              country: result.country,
              company: result.company,
              zip: result.postal_code,
            },
            customerAccessToken: getToken,
          },
        });

        if (data) {
          setErrors({});
          setState({
            first_name: '',
            last_name: '',
            phone_number: '',
            company: '',
            first_address: '',
            second_address: '',
            country: '',
            province: '',
            city: '',
            postal_code: '',
          });
          setIsLoading(false);
          navigation.navigate('Address', { refetch });
        }
        if (error) {
          setIsLoading(false);
          Toast.show({
            type: 'error',
            text1: 'Oops!',
            text2: error?.message || 'something went wrong',
          });
        }
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          const errorsVal = err.inner.reduce((acc, error) => {
            const { path, message } = error;
            acc[path] = message;
            return acc;
          }, {});
          setErrors(errorsVal);
        } else {
          Toast.show({
            type: 'error',
            text1: 'oops!',
            text2: err?.originalError?.message || 'something went wrong',
          });
        }
        setIsLoading(false);
      });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.backgroundColor,
      }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <Header titleLeft leftIcon="back" title="Back" />
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView>
          <View style={GlobalStyleSheet.container}>
            <View
              style={{
                paddingBottom: 10,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  ...FONTS.fontSatoshiBold,
                  fontSize: 24,
                  color: COLORS.title,
                }}
              >
                Add Address
              </Text>
            </View>
            <Input
              name="first_name"
              label="First Name"
              placeholder="e.g. John"
              value={customerInfo?.first_name}
              handleInputChange={val => handleFieldChange(val, 'first_name')}
              errors={errors}
            />
            <Input
              name="last_name"
              label="Last Name"
              placeholder="e.g. Doe"
              value={customerInfo?.last_name}
              handleInputChange={val => handleFieldChange(val, 'last_name')}
              errors={errors}
            />
            <Input
              name="phone_number"
              label="Phone Number"
              placeholder="e.g. +628123456789"
              keyboardType="phone-pad"
              value={customerInfo?.phone}
              handleInputChange={val => handleFieldChange(val, 'phone_number')}
              errors={errors}
            />
            <Input
              name="company"
              label="Company"
              placeholder="e.g. PT ABC"
              handleInputChange={val => handleFieldChange(val, 'company')}
              errors={errors}
            />
            <InputTextArea
              name="first_address"
              label="Address 1"
              placeholder="e.g. Jl. Taman Anggrek"
              numberOfLines={4}
              handleInputChange={val => handleFieldChange(val, 'first_address')}
              errors={errors}
            />
            <InputTextArea
              name="second_address"
              label="Address 2"
              placeholder="e.g. Jl. Taman Anggrek"
              numberOfLines={4}
              handleInputChange={val => handleFieldChange(val, 'second_address')}
              errors={errors}
            />
            <View style={{ flex: 1, backgroundColor: COLORS.backgroundColor }}>
              <AsyncSelectComponent
                name="country"
                label="Country"
                options={countries}
                onChange={val => handleChangeCountry(val, 'country')}
                onSelect={val => handleFieldChange(val, 'country')}
                errors={errors}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: COLORS.backgroundColor }}>
              <AsyncSelectComponent
                name="province"
                label="Province"
                options={provinces}
                onSelect={val => handleFieldChange(val, 'province')}
                errors={errors}
              />
            </View>
            <Input
              name="city"
              label="City"
              placeholder="e.g. Jakarta Selatan"
              handleInputChange={val => handleFieldChange(val, 'city')}
              errors={errors}
            />
            <Input
              name="postal_code"
              label="Postal Code"
              placeholder="e.g. 12190"
              keyboardType="number-pad"
              handleInputChange={val => handleFieldChange(val, 'postal_code')}
              errors={errors}
            />
          </View>
        </ScrollView>
      </View>
      <View style={[GlobalStyleSheet.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <CustomButton
          onPress={handleSubmit}
          title={isLoading ? 'Saving ...' : 'Save Address'}
          disabled={isLoading}
          customWidth={200}
        />
      </View>
    </SafeAreaView>
  );
}

export default AddDeliveryAddress;