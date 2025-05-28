const handleGetContact = async () => {
  setLoading(true);
  try {
    console.log('Sending contact request with:', {
      userId: userId,
      propId: property?._id
    });

    const response = await axios.post(
      `${process.env.REACT_APP_API_IP}/v2/contacted/kcndjiwnjn/jdnjsnja/cxlbijbijsb`,
      {
        userId: userId,
        propId: property?._id
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log('Contact API Response:', response.data);

    if (response.data.success) {
      const contactInfo = response.data.data;
      setContactInfo(contactInfo);

      // Check if the user is on a mobile device
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);

      if (isMobileDevice && contactInfo?.number) {
        let phoneNumber = contactInfo.number;
        let name = contactInfo.name;

        // Check if the phone number starts with +91, and remove it if present
        if (phoneNumber.startsWith("+91")) {
          phoneNumber = phoneNumber.replace("+91", "").trim();
        }

        // Redirect to the phone's dialer app
        window.location.href = `tel:${phoneNumber}`;
      }
    } else {
      console.error('Error in response:', response.data.error);
    }
  } catch (error) {
    console.error('Error getting contact:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  } finally {
    setLoading(false);
  }
}; 