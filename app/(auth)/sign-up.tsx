import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { createUser } from '../../lib/appwrite';

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submit = async () => {
    const { name, email, password } = form;
    if (!name || !email || !password) return Alert.alert('Error', 'Please enter valid email & password');
    setIsSubmitting(true);

    try {
      await createUser({ name, email, password });
      //appwrite sign up logic here
      router.replace('/tabs');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <View className='gap-10 bg-white rounded-lg p-5 mt-5'>
      <CustomInput
        placeholder='Enter your full name'
        value={form.name}
        onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
        label='Full Name'
        keyboardType='email-address'
      />
      <CustomInput
        placeholder='Enter your email'
        value={form.email}
        onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
        label='Email'
        keyboardType='email-address'
      />
      <CustomInput
        placeholder='Enter your password'
        value={form.password}
        onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
        label='Password'
        secureTextEntry={true}
      />

      <CustomButton
        title='Sign Up'
        isLoading={isSubmitting}
        onPress={submit}
      />
      <View className='flex flex-row justify-center mt-5 gap-2'>
        <Text className='base-regular text-gray-100'>
          Already have an account?
        </Text>
        <Link href='/sign-in' className='text-primary base-bold'>
          Sign In
        </Link>
      </View>
    </View>
  )
}

export default SignUp