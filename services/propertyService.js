// file: services/propertyService.js
const mongoose = require("mongoose");
const PropertyDetails = require("../models/PropertyDetails");
const User = require("../models/User");
const UserPropertyStatus = require("../models/UserPropertyStatus");
const UserPropertyRemark = require("../models/UserPropertyRemark");
const Suggestion = require("../models/Suggestion");
const moment = require("moment");
class PropertyService {
  /**
   * Filter properties for sharing flat
   * @param {Object} filterRequest - Filter criteria
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<Object>} - Paginated properties
   */
  async filterPropertiesSharingFlat(filterRequest, page, size) {
    const { userId, propertyType, location, priceMin, priceMax, gender } =
      filterRequest;

    // Build query
    const query = { isActive: true };

    if (propertyType) {
      query.propertyType = propertyType;
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = priceMin;
      if (priceMax) query.price.$lte = priceMax;
    }

    if (gender) {
      query.gender = gender;
    }

    // Get paginated results
    const options = {
      page: parseInt(page) + 1, // MongoDB Pagination starts from 1
      limit: parseInt(size),
      sort: { createdAt: -1 },
    };

    return await PropertyDetails.paginate(query, options);
  }

  /**
   * Filter properties for sharing flat v2
   * @param {Object} filterRequest - Filter criteria
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<Object>} - Paginated properties
   */

  async filterPropertiesSharingFlatV2(filterRequest, page, size) {
    const {
      userId,
      type,
      location,
      priceMin,
      priceMax,
      search,
      gender,
      amenities,
      roomType,
      status,
      listedOn,
      areas,
      bhks,
      furnishedTypes,
      subType,
      minRent,
      maxRent,
      minsqFt,
      maxsqFt
    } = filterRequest;

    let query = { isDeleted: { $ne: 1 } };
    
    // 1. Premium check
    if (userId) {
      const user = await User.findById(userId).lean();
      if (!user || user.isPremium === 0) {
        return {
          properties: [],
          currentPage: page,
          totalItems: 0,
          totalPages: 0,
        };
      }
    }

    // 2. Build base query with all filters
    if (type) query.type = type;
    if (location) query.address = { $regex: location, $options: "i" };
    if (priceMin || priceMax) {
      query.rentValue = {};
      if (priceMin) query.rentValue.$gte = priceMin;
      if (priceMax) query.rentValue.$lte = priceMax;
    }
    if (gender) query.gender = gender;
    if (roomType) query.roomType = roomType;
    if (areas?.length) query.area = { $in: areas };
    if (subType?.length) query.unitType = { $in: subType };
    if (bhks?.length) query.bhk = { $in: bhks };
    if (furnishedTypes?.length) query.furnishedType = { $in: furnishedTypes };
    if (minsqFt || maxsqFt) {
      query.sqFt = {};
      if (minsqFt) query.sqFt.$gte = Number(minsqFt);
      if (maxsqFt) query.sqFt.$lte = Number(maxsqFt);
    }
    if (minRent || maxRent) {
      query.rentValue = {};
      if (minRent) query.rentValue.$gte = Number(minRent);
      if (maxRent) query.rentValue.$lte = Number(maxRent);
    }
    if (amenities?.length) {
      query.$and = amenities.map((a) => ({
        amenities: { $regex: new RegExp(`\\b${a}\\b`, "i") },
      }));
    }
    if (search?.trim()) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      query.$or = words.map((word) => ({
        title: { $regex: new RegExp(`.*${word}.*`, "i") },
      }));
    }

    
    try {
      // 5. Build aggregation pipeline for efficient querying
      const pipeline = [
        { $match: query },
        { $sort: { createdOn: -1 } }
      ];

      // 6. Add lookup stages for user-specific data if userId is provided
      if (userId) {
        // Explicitly fetch the latest user document to get savedPropertyIds
        const latestUser = await User.findById(userId).lean();
        const userSavedPropertyIds = new Set(latestUser?.savedPropertyIds?.map(id => id.toString()) || []);

        pipeline.push(
          { $skip: page * size },
          { $limit: size }
        );

        // 8. Execute aggregation with parallel count
        const [properties, totalCount] = await Promise.all([
          PropertyDetails.aggregate(pipeline),
          PropertyDetails.countDocuments(query)
        ]);

        // Fetch statuses and remarks separately for properties retrieved in this page
        const propertyIdsOnPage = properties.map(p => p._id.toString());
        const [statuses, remarks] = await Promise.all([
          UserPropertyStatus.find({ userId, propId: { $in: propertyIdsOnPage } }).lean(),
          UserPropertyRemark.find({ userId, propId: { $in: propertyIdsOnPage } }).lean(),
        ]);

        const statusMap = Object.fromEntries(statuses.map(s => [s.propId, s.status]));
        const remarkMap = Object.fromEntries(remarks.map(r => [r.propId, r.remark]));
        const excludedStatuses = ["Sell out", "Rent out", "Broker", "Duplicate", "Data Mismatch"];
        const isSpecificUser = userId === "67128ea2d6da233a1af20f30";

        // 9. Process results efficiently
        const processedProperties = properties
          .map(property => {
            const propId = property._id.toString();
            const status = statusMap[propId] || "Active";
            const remark = remarkMap[propId] || null;
            // Check if the property ID is in the fetched savedPropertyIds set
            const isSaved = userSavedPropertyIds.has(propId) ? 1 : 0;

            return {
              ...property,
              status,
              remark,
              isSaved: isSaved,
              number: latestUser?.contactedPropertyIds?.includes(propId) 
                ? isSpecificUser
                  ? "9" + Math.floor(100000000 + Math.random() * 900000000).toString()
                  : String(property.number || "0")
                : "0",
              name: latestUser?.contactedPropertyIds?.includes(propId) ? property.name : "0"
            };
          })
          .filter(p => !excludedStatuses.includes(p.status));

        return {
          properties: processedProperties,
          currentPage: page,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / size)
        };

      } else { // Handle case where userId is not provided
         pipeline.push(
          { $skip: page * size },
          { $limit: size }
        );

        const [properties, totalCount] = await Promise.all([
          PropertyDetails.aggregate(pipeline),
          PropertyDetails.countDocuments(query)
        ]);

        const processedProperties = properties.map(property => ({
          ...property,
          isSaved: 0, // Not saved if no user ID
          status: "Active",
          remark: null,
          number: "0",
          name: "0"
        }));

        return {
          properties: processedProperties,
          currentPage: page,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / size)
        };
      }

    } catch (error) {
      console.error('Error in filterPropertiesSharingFlatV2:', error);
      throw new Error('Failed to fetch properties');
    }
  }

  /**
   * Get property counts by status and type
   * @returns {Promise<Object>} - Counts object
   */
  async getPropertyCountsByStatusAndType() {
    const counts = {};

    try {
      const startOfToday = moment().utc().startOf("day").toDate();
      const endOfToday = moment().utc().endOf("day").toDate();

      const matchCommon = { isDeleted: 0 };

      // Helper to get count based on type and date range
      const countProperties = async (type, dateRange = null) => {
        const match = { ...matchCommon, type };
        if (dateRange) {
          match.createdOn = { $gte: dateRange.start, $lt: dateRange.end };
        }
        return PropertyDetails.countDocuments(match);
      };

      // Today counts
      counts.todayResidentialRental = await countProperties(
        "Residential Rent",
        { start: startOfToday, end: endOfToday }
      );
      counts.todayResidentialSell = await countProperties("Residential Sell", {
        start: startOfToday,
        end: endOfToday,
      });
      counts.todayCommercialRent = await countProperties("Commercial Rent", {
        start: startOfToday,
        end: endOfToday,
      });
      counts.todayCommercialSell = await countProperties("Commercial Sell", {
        start: startOfToday,
        end: endOfToday,
      });

      // Active counts
      counts.activeResidentialRental = await countProperties(
        "Residential Rent"
      );
      counts.activeResidentialSell = await countProperties("Residential Sell");
      counts.activeCommercialRent = await countProperties("Commercial Rent");
      counts.activeCommercialSell = await countProperties("Commercial Sell");

      // Agent-based counts (optional - uncomment if needed)
      // const agentFilter = { ...matchCommon, userType: "Agent" };
      // const countAgentProperties = async (type) => {
      //   return PropertyDetails.countDocuments({ ...agentFilter, type });
      // };
      // counts.agentResidentialRental = await countAgentProperties("Residential Rent");
      // counts.agentResidentialSell = await countAgentProperties("Residential Sell");
      // counts.agentCommercialRent = await countAgentProperties("Commercial Rent");
      // counts.agentCommercialSell = await countAgentProperties("Commercial Sell");

      // Totals
      counts.totalActiveProperties =
        counts.activeResidentialRental +
        counts.activeResidentialSell +
        counts.activeCommercialRent +
        counts.activeCommercialSell;

      // If agent counts enabled
      // counts.totalagentProperties =
      //   counts.agentResidentialRental +
      //   counts.agentResidentialSell +
      //   counts.agentCommercialRent +
      //   counts.agentCommercialSell;
    } catch (err) {
      console.error("Error while fetching property counts:", err);
    }

    return counts;
  }

  /**
   * Contact property to user v2
   * @param {string} userId - User ID
   * @param {string} propId - Property ID
   * @returns {Promise<Object>} - Property details
   */
  async contactPropertyToUserV2(userId, propId) {
    console.log('contactPropertyToUserV2 called with:', { userId, propId });

    if (!userId || !propId) {
      console.log('Invalid input:', { userId, propId });
      throw new TypeError("User ID and Property ID are required");
    }

    const user = await User.findById(userId);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      throw new Error("User not found");
    }

    const property = await PropertyDetails.findById(propId);
    console.log('Found property:', property ? 'Yes' : 'No');
    
    if (!property) {
      throw new Error("Property not found");
    }

    // Check if user has reached contact limit
    console.log('User contact limit:', user.limit);
    if (user.limit <= 0) {
      throw new Error("Contact limit reached");
    }

    // Add property to contacted list if not already contacted
    if (!user.contactedPropertyIds) {
      user.contactedPropertyIds = [];
    }

    // user.contactedPropertyIds.push(propId);
    // user.limit--;
    // user.totalCount = (user.totalCount || 0) + 1;
    // await user.save();

    if (!user.contactedPropertyIds.includes(propId)) {
      console.log('Adding property to contacted list');
      // Use findOneAndUpdate instead of save to bypass validation
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: { contactedPropertyIds: propId },
          $inc: { 
            limit: -1,
            totalCount: 1
          }
        },
        { new: true }
      );
      console.log('User updated successfully');
    } else {
      console.log('Property already in contacted list');
    }

    return property;
  }
  
  async searchpremiseandaddress(query) {
    try {
      if (!query) {
        throw new Error("Search query is required");
      }

      // Create case-insensitive regex pattern for the search query
      const searchPattern = new RegExp(query, 'i');

      // Search in title field and only return title
      const properties = await PropertyDetails.find(
        {
          title: searchPattern,
          isDeleted: { $ne: 1 }
        },
        { title: 1, _id: 0 }  // Only return title field, exclude _id
      ).sort({ createdOn: -1 });

      console.log(`Found ${properties.length} properties matching query: ${query}`);

      return {
        success: true,
        data: properties.map(p => p.title)  // Return array of titles only
      };
    } catch (error) {
      console.error('Error searching properties:', error);
      throw new Error(error.message || "Failed to search properties");
    }
  }

  /**
   * Update property status
   * @param {string} propId - Property ID
   * @param {string} newStatus - New status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated property status
   */
  async updatePropertyStatus(propId, newStatus, userId) {
    if (!propId || !newStatus || !userId) {
      throw new Error("Property ID, new status, and user ID are required");
    }

    // Validate status
    const validStatuses = ['Active', 'Sell out', 'Rent out', 'Broker', 'Duplicate', 'Data Mismatch'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      // Find existing status record
      let statusRecord = await UserPropertyStatus.findOne({ propId, userId });

      if (statusRecord) {
        // Update existing record
        statusRecord.status = newStatus;
        statusRecord.updatedAt = new Date();
        await statusRecord.save();
      } else {
        // Create new record
        statusRecord = new UserPropertyStatus({
          propId,
          userId,
          status: newStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await statusRecord.save();
      }

      // If status is one of the excluded ones, remove from saved properties
      const excludedStatuses = ["Sell out", "Rent out", "Broker", "Duplicate", "Data Mismatch"];
      if (excludedStatuses.includes(newStatus)) {
        await User.findByIdAndUpdate(
          userId,
          { $pull: { savedPropertyIds: propId } },
          { new: true }
        );
      }

      return { 
        success: true, 
        message: "Status updated successfully", 
        status: statusRecord,
        propertyId: propId,
        newStatus: newStatus
      };
    } catch (error) {
      console.error("Error updating property status:", error);
      throw new Error(error.message || "Failed to update property status");
    }
  }

  /**
   * Get saved properties v2
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<Object>} - Paginated saved properties
   */

  /**
   * Get saved properties v2
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<Object>} - Paginated saved properties
   */
  async getSavedPropertiesV2(userId, page, size) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // If no saved properties, return empty result
    if (!user.savedPropertyIds || user.savedPropertyIds.length === 0) {
      return {
        properties: [],
        currentPage: page,
        totalItems: 0,
        totalPages: 0,
      };
    }

    // Build query for saved properties
    const query = {
      _id: { $in: user.savedPropertyIds },
      isDeleted: { $ne: 1 },
    };

    // Manual pagination
    const skip = page * size;
    const properties = await PropertyDetails.find(query)
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(size)
      .lean();

    const totalItems = await PropertyDetails.countDocuments(query);

    // Add extra metadata similar to filterPropertiesSharingFlatV2
    let enrichedProperties = properties;

    if (properties.length) {
      const contactedSet = new Set(user.contactedPropertyIds || []);
      const savedSet = new Set(user.savedPropertyIds || []);
      const ids = properties.map((p) => p._id.toString());

      const [statuses, remarks] = await Promise.all([
        UserPropertyStatus.find({ userId, propId: { $in: ids } }).lean(),
        UserPropertyRemark.find({ userId, propId: { $in: ids } }).lean(),
      ]);

      const statusMap = Object.fromEntries(
        statuses.map((s) => [s.propId, s.status])
      );
      const remarkMap = Object.fromEntries(
        remarks.map((r) => [r.propId, r.remark])
      );
      const excludedStatuses = ["Sell out", "Rent out", "Broker", "Duplicate"];
      const isSpecificUser = userId === "67128ea2d6da233a1af20f30";

      enrichedProperties = properties
        .map((p) => {
          const id = p._id.toString();
          return {
            ...p,
            isSaved: savedSet.has(id) ? 1 : 0,
            status: statusMap[id] || "Active",
            remark: remarkMap[id] || null,
            number: contactedSet.has(id)
              ? isSpecificUser
                ? "9" + Math.floor(100000000 + Math.random() * 900000000).toString()
                : String(p.number || "0")
              : "0",
            name: contactedSet.has(id) ? p.name : "0",
          };
        })
        .filter((p) => !excludedStatuses.includes(p.status));
    }

    return {
      properties: enrichedProperties,
      currentPage: page,
      totalItems,
      totalPages: Math.ceil(totalItems / size),
    };
  }
  // async getSavedPropertiesV2(userId, page, size) {
  //   if (!userId) {
  //     throw new Error('User ID is required');
  //   }

  //   const user = await User.findById(userId);
  //   if (!user) {
  //     throw new Error('User not found');
  //   }

  //   // If no saved properties, return empty result
  //   if (!user.savedPropertyIds || user.savedPropertyIds.length === 0) {
  //     return {
  //       docs: [],
  //       totalDocs: 0,
  //       page: 1,
  //       totalPages: 0,
  //       limit: parseInt(size)
  //     };
  //   }

  //   // Get paginated saved properties
  //   const options = {
  //     page: parseInt(page) + 1,
  //     limit: parseInt(size)
  //   };
  //   print()
  //   return await PropertyDetails.paginate(
  //     { _id: { $in: user.savedPropertyIds }, isActive: true },
  //     options
  //   );
  // }

  /**
   * Save suggestion
   * @param {Object} suggestion - Suggestion data
   * @returns {Promise<Object>} - Saved suggestion
   */
  async saveSuggestion(suggestion) {
    if (!suggestion.userId || !suggestion.text) {
      throw new Error("User ID and text are required");
    }

    const newSuggestion = new Suggestion({
      ...suggestion,
      createdAt: new Date(),
    });

    return await newSuggestion.save();
  }

  /**
   * Add or update remark
   * @param {string} propId - Property ID
   * @param {string} userId - User ID
   * @param {string} remark - Remark text
   * @returns {Promise<Object>} - Updated remark
   */
  async addOrUpdateRemark(propId, userId, remark) {
    if (!propId || !userId || !remark) {
      throw new Error("Property ID, user ID, and remark are required");
    }

    // Find existing remark
    let remarkRecord = await UserPropertyRemark.findOne({ propId, userId });

    if (remarkRecord) {
      // Update existing remark
      remarkRecord.remark = remark;
      remarkRecord.updatedOn = new Date();
      await remarkRecord.save();
      return remarkRecord;
    } else {
      // Create new remark
      remarkRecord = new UserPropertyRemark({
        propId,
        userId,
        remark,
        createdOn: new Date(),
        updatedOn: new Date(),
      });
      await remarkRecord.save();
      return remarkRecord;
    }
  }
}

module.exports = PropertyService;
