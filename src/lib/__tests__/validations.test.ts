import { createBuyerSchema, csvImportRowSchema } from '../validations/buyer';

describe('Buyer Validation', () => {
  describe('createBuyerSchema', () => {
    it('should validate a valid buyer', () => {
      const validBuyer = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: 1000000,
        budgetMax: 2000000,
        timeline: '3-6m',
        source: 'Website',
        notes: 'Looking for a 2BHK apartment',
        tags: ['urgent', 'premium'],
      };

      const result = createBuyerSchema.safeParse(validBuyer);
      expect(result.success).toBe(true);
    });

    it('should require BHK for Apartment and Villa', () => {
      const buyerWithoutBHK = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(buyerWithoutBHK);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['bhk']);
      }
    });

    it('should validate budget constraints', () => {
      const buyerWithInvalidBudget = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: 2000000,
        budgetMax: 1000000, // Max < Min
        timeline: '3-6m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(buyerWithInvalidBudget);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['budgetMax']);
      }
    });

    it('should validate phone number format', () => {
      const buyerWithInvalidPhone = {
        fullName: 'John Doe',
        phone: '123', // Too short
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(buyerWithInvalidPhone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['phone']);
      }
    });
  });

  describe('csvImportRowSchema', () => {
    it('should validate CSV row with string numbers', () => {
      const csvRow = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: '1000000',
        budgetMax: '2000000',
        timeline: '3-6m',
        source: 'Website',
        notes: 'Looking for a 2BHK apartment',
        tags: 'urgent,premium',
        status: 'New',
      };

      const result = csvImportRowSchema.safeParse(csvRow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budgetMin).toBe(1000000);
        expect(result.data.budgetMax).toBe(2000000);
        expect(result.data.tags).toEqual(['urgent', 'premium']);
      }
    });

    it('should handle empty strings in CSV', () => {
      const csvRow = {
        fullName: 'John Doe',
        email: '',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Plot',
        bhk: '',
        purpose: 'Buy',
        budgetMin: '',
        budgetMax: '',
        timeline: '3-6m',
        source: 'Website',
        notes: '',
        tags: '',
        status: 'New',
      };

      const result = csvImportRowSchema.safeParse(csvRow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeUndefined();
        expect(result.data.bhk).toBeUndefined();
        expect(result.data.budgetMin).toBeUndefined();
        expect(result.data.budgetMax).toBeUndefined();
        expect(result.data.tags).toEqual([]);
      }
    });
  });
});
