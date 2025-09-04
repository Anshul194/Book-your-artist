import CategoryRepository from "../repository/categoryRepository.js";
import Event from "../models/Event.js"; // Assuming you have an Event model defined

class CategoryService {
  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async createCategory({ title, coverImage, image, status = 'active' }) {
    try {
      if (!title) {
        throw new Error('Category title is required');
      }

      // Check if category with same title already exists
      const existingCategory = await this.categoryRepository.findBy({ 
        title: { $regex: new RegExp(`^${title}$`, 'i') } 
      });

      if (existingCategory) {
        throw new Error('Category with this title already exists');
      }

      return await this.categoryRepository.create({
        title: title.trim(),
        coverImage: coverImage?.trim(),
        image: image?.trim(),
        status
      });
    } catch (error) {
      console.error("❌ Error in createCategory:", error);
      throw error;
    }
  }

  async getAllCategories(filter = {}, sort = { createdAt: -1 }, skip = 0, limit = 10) {
    try {
      // Fetch categories with pagination
      const categories = await this.categoryRepository.findMany(filter, sort, skip, limit);

      // For each category, fetch events belonging to that category
      // Fetch events for all categories in parallel and add them to each category object
      const categoriesWithEvents = await Promise.all(
        categories.map(async (category) => {
          const events = await Event.find({ category: category._id })
        .select('name image coverImage startDate startTime endTime placeName fullAddress status eventStatus');
          let eventsData;
          if (events.length === 1) {
        eventsData = events[0].toObject();
          } else if (events.length > 1) {
        eventsData = events.map(e => e.toObject());
          } else {
        eventsData = [];
          }
          return { ...category.toObject(), events: eventsData };
        })
      );
      // Use the enriched array directly
      const enrichedCategories = categoriesWithEvents;

    console.log("Fetched categories:", enrichedCategories);

    const total = await this.categoryRepository.count(filter);
    
    return {
      categories: enrichedCategories,
      pagination: {
        total,
        page: Math.floor(skip / limit) + 1,
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    };
    } catch (error) {
      console.error("❌ Error in getAllCategories:", error);
      throw new Error("Failed to get all categories");
    }
  }

  async getCategoryById(id) {
    try {
      return await this.categoryRepository.findById(id);
    } catch (error) {
      console.error("❌ Error in getCategoryById:", error);
      throw error;
    }
  }

  async updateCategory(id, updateData) {
    try {
      if (updateData.title) {
        // Check if another category with same title exists
        const existingCategory = await this.categoryRepository.findBy({ 
          title: { $regex: new RegExp(`^${updateData.title}$`, 'i') },
          _id: { $ne: id }
        });

        if (existingCategory) {
          throw new Error('Category with this title already exists');
        }
        
        updateData.title = updateData.title.trim();
      }

      if (updateData.coverImage) {
        updateData.coverImage = updateData.coverImage.trim();
      }

      if (updateData.image) {
        updateData.image = updateData.image.trim();
      }

      return await this.categoryRepository.updateById(id, updateData);
    } catch (error) {
      console.error("❌ Error in updateCategory:", error);
      throw error;
    }
  }

  async deleteCategory(id) {
  if (!id) {
    throw new Error('Category ID is required');
  }

  try {
    const deletedCategory = await this.categoryRepository.deleteById(id);

    if (!deletedCategory) {
      throw new Error('Category not found');
    }

    return deletedCategory;
  } catch (error) {
    console.error('❌ Error in deleteCategory:', error);
    throw error;
  }
}


  async getActiveCategories() {
    try {
      return await this.categoryRepository.findByStatus('active');
    } catch (error) {
      console.error("❌ Error in getActiveCategories:", error);
      throw new Error("Failed to get active categories");
    }
  }

  async updateCategoryStatus(id, status) {
    try {
      return await this.categoryRepository.updateStatus(id, status);
    } catch (error) {
      console.error("❌ Error in updateCategoryStatus:", error);
      throw error;
    }
  }

  async searchCategories(searchTerm, status = null) {
    try {
      const filter = {
        title: { $regex: searchTerm, $options: 'i' }
      };

      if (status) {
        filter.status = status;
      }

      return await this.categoryRepository.findMany(filter);
    } catch (error) {
      console.error("❌ Error in searchCategories:", error);
      throw new Error("Failed to search categories");
    }
  }

  async getCategoryCoverImages() {
  try {
    return await this.categoryRepository.findCoverImages();
  } catch (error) {
    console.error("❌ Error in getCategoryCoverImages:", error);
    throw new Error("Failed to fetch cover images");
  }
}

}

export default CategoryService;