import { images } from '@/constants';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, TextInput, TouchableOpacity, View } from 'react-native';

const SearchBar = () => {
  const params = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(params.query);

  // Correctly define typingTimeout using `ReturnType<typeof setTimeout>`
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle text input change
  const handleSearch = (text: string) => {
    setQuery(text);

    // Clear the previous timeout if it exists
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set a new timeout
    typingTimeout.current = setTimeout(() => {
      if (text.trim()) {
        router.setParams({ query: text });
      } else {
        router.setParams({ query: undefined });
      }
    }, 1000); // Trigger after 1 second of inactivity
  };

  // Handle the search button press (optional)
  const handleSearchButtonPress = () => {
    if (query?.trim()) {
      router.setParams({ query });
    }
  };

  return (
    <View className="searchbar">
      <TextInput
        className="flex-1 p-5"
        placeholder="Search for pizzas, burgers ..."
        value={query}
        onChangeText={handleSearch}
        onSubmitEditing={handleSearchButtonPress}
        placeholderTextColor="#A0A0A0"
        returnKeyType="search"
      />
      <TouchableOpacity
        className="pr-5"
        onPress={handleSearchButtonPress}
      >
        <Image
          source={images.search}
          className="size-6"
          resizeMode="contain"
          tintColor="#5D5F6D"
        />
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;
