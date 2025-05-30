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

const handleStatusChange = async (newStatus) => {
    try {
      const data = {
        propId: property?._id,
        userId: userId,
        newStatus: newStatus,
      };
      console.log(`this is Hidden Function User = ${data.userId}`)
      console.log(`this is Hidden Function property= ${data.propId}`)
      
      const response = await fetch(`${process.env.REACT_APP_API_IP}/cjidnvij/ceksfbuebijn/user/ckbwubuw/cjiwbucb/${property?._id}/status/cajbyqwvfydgqv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      if (result.success) {
        // Update local state
        setStatus(newStatus);
        
        // Refresh the properties list after a short delay
        if (typeof fetchProperties === "function") {
          setTimeout(() => {
            fetchProperties();
          }, 100);
        }
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setStatus(status); // Revert to previous status on error
    }
  };

const handleSaveClick = async () => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_IP}/cjidnvij/ceksfbuebijn/user/save-property/ijddskjidns/cudhsbcuev`,
      {
        userId: userId,
        propId: property._id,
      }
    );

    if (response.data.success) {
      // Update local state based on the response
      const isSaved = response.data.data.saved;
      setIsSaved(isSaved); // Assuming you have a state variable for saved status
      
      // Show success message
      toast.success(isSaved ? "Property saved successfully" : "Property unsaved successfully");
      
      // If you have a callback to refresh the properties list
      if (typeof onSaveStatusChange === 'function') {
        onSaveStatusChange(property._id, isSaved);
      }
    } else {
      toast.error(response.data.error || "Failed to update save status");
    }
  } catch (error) {
    console.error("Error saving property:", error);
    toast.error("Failed to update save status. Please try again.");
  }
}; 