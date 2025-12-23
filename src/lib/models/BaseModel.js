import { z } from 'zod';
import prisma from '$lib/prisma.js';
import { Prisma } from '@prisma/client';
import { convertBigIntsToStrings } from '$lib/utils/Helpers.js';

export class BaseModel {
    constructor(data = {}) {
        this.data = convertBigIntsToStrings(data);
        this.errors = {};
        this.isValid = true;
    }

    // Validation methods
    validate() {
        this.errors = {};
        this.isValid = true;
        
        // Run schema validation if defined
        if (this.constructor.schema) {
            try {
                // Parse and update data with transformed values (e.g., string dates to Date objects)
                const parsed = this.constructor.schema.parse(this.data);
                // Update this.data with the parsed/transformed values
                this.data = { ...this.data, ...parsed };
            } catch (error) {
                // Handle Zod validation errors
                if (error.issues && Array.isArray(error.issues)) {
                    error.issues.forEach((issue) => {
                        const field = issue.path.join('.') || 'root';
                        if (!this.errors[field]) {
                            this.errors[field] = [];
                        }
                        this.errors[field].push(issue.message);
                    });
                } else {
                    // Fallback to formErrors if available
                    this.errors = error.formErrors?.fieldErrors || {};
                }
                this.isValid = false;
            }
        }

        // Run custom validations
        this.runValidations();
        
        return this.isValid;
    }

    runValidations() {
        // Override in subclasses
    }

    addError(field, message) {
        if (!this.errors[field]) {
            this.errors[field] = [];
        }
        this.errors[field].push(message);
        this.isValid = false;
    }

    // Callback methods
    async beforeCreate() {
        // Override in subclasses
        // Only generate a record number if not already provided
        if (!this.data.number) {
            this.data.number = await this.generateRecordNumber();
        }
    }

    async generateRecordNumber() {
        // Fallback: if prismaModel is not available, just return a timestamp-based number
        const delegate = this.constructor.prismaModel || this.prismaModel;
        if (!delegate || typeof delegate.count !== 'function') {
            const modelName = this.constructor.name.toUpperCase();
            const modelFirst3Letters = modelName.slice(0, 3);
            const ts = Date.now().toString().slice(-6);
            return `${modelFirst3Letters}${ts.padStart(6, '0')}`;
        }

        const modelName = this.constructor.name.toUpperCase();
        const modelFirst3Letters = modelName.slice(0, 3);
        const count = await delegate.count();
        return `${modelFirst3Letters}${(count + 1).toString().padStart(6, '0')}`;
    }

    async afterCreate() {
        // Override in subclasses
    }

    async beforeUpdate() {
        // Override in subclasses
    }

    async afterUpdate() {
        // Override in subclasses
    }

    async beforeSave() {
        // Override in subclasses
    }

    async afterSave() {
        // Override in subclasses
    }

    async beforeDestroy() {
        // Override in subclasses
    }

    async afterDestroy() {
        // Override in subclasses
    }

    // CRUD operations with callbacks and validation
    async create() {
        await this.beforeSave();
        await this.beforeCreate();

        if (!this.validate()) {
            throw new Error('Validation failed: ' + JSON.stringify(this.errors));
        }

        const result = await this.constructor.prismaModel.create({
            data: this.prepareDataForSave(true) // true indicates create operation
        });

        this.data = { ...this.data, ...convertBigIntsToStrings(result) };
        
        await this.afterCreate();
        await this.afterSave();

        return this.serializeForJson();
    }

    async update(updateData) {
        this.data = { ...this.data, ...updateData };
        
        await this.beforeSave();
        await this.beforeUpdate();

        if (!this.validate()) {
            throw new Error('Validation failed: ' + JSON.stringify(this.errors));
        }

        const result = await this.constructor.prismaModel.update({
            where: { id: this.data.id },
            data: this.prepareDataForSave(false) // false indicates update operation
        });

        this.data = { ...this.data, ...convertBigIntsToStrings(result) };
        
        await this.afterUpdate();
        await this.afterSave();

        return this.serializeForJson();
    }

    async destroy() {
        await this.beforeDestroy();

        await this.constructor.prismaModel.delete({
            where: { id: this.data.id }
        });

        await this.afterDestroy();

        return true;
    }

    // Helper methods
    prepareDataForSave(isCreate = false) {
        const data = { ...this.data };
        delete data.id; // Remove id for create operations
        
        // Get the list of valid fields for this model from Prisma DMMF
        const validFields = this.getValidFieldsForModel();
        
        // Remove fields that are not valid for this model (like meters_attributes)
        if (validFields.length > 0) {
            Object.keys(data).forEach(key => {
                // Keep the key if it's a valid field, a relation name, or ends with _id (scalar FK)
                const isValidField = validFields.includes(key);
                const isRelationConnect = data[key] && typeof data[key] === 'object' && 
                    (data[key].connect || data[key].create || data[key].update || data[key].upsert);
                
                // Check if this is a loaded relation object (has id but no Prisma operation)
                // These should be removed as they're just included data, not update instructions
                const isLoadedRelation = data[key] && typeof data[key] === 'object' && 
                    !Array.isArray(data[key]) &&
                    (data[key].id !== undefined) && 
                    !isRelationConnect;
                
                // Also check for loaded relation arrays (like devices[], meters[], etc.)
                const isLoadedRelationArray = Array.isArray(data[key]) && 
                    data[key].length > 0 && 
                    typeof data[key][0] === 'object' &&
                    data[key][0].id !== undefined;
                
                if (!isValidField && !isRelationConnect) {
                    delete data[key];
                } else if (isLoadedRelation || isLoadedRelationArray) {
                    // Remove loaded relation data - it's not meant for saving
                    delete data[key];
                }
            });
        }
        
        // Automatically set timestamps if the model has these fields
        const now = new Date();
        
        // Check if model has created_at field (by checking if it exists in data or Prisma schema)
        // Set created_at only on create operations if not already set
        if (isCreate && !data.hasOwnProperty('created_at') && this.hasTimestampField('created_at')) {
            data.created_at = now;
        }
        
        // Set updated_at on both create and update operations if field exists
        if (!data.hasOwnProperty('updated_at') && this.hasTimestampField('updated_at')) {
            data.updated_at = now;
        }
        
        // Process nested relations and set timestamps on nested creates
        Object.keys(data).forEach(key => {
            const value = data[key];
            
            // Handle nested Prisma relation objects
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Handle nested create operations
                if (value.create !== undefined) {
                    // If create is an object, set timestamps on it
                    if (typeof value.create === 'object' && !Array.isArray(value.create)) {
                        data[key] = {
                            ...value,
                            create: this.addTimestampsToNestedCreate(value.create, key, isCreate)
                        };
                    } else if (Array.isArray(value.create)) {
                        // Handle array of creates
                        data[key] = {
                            ...value,
                            create: value.create.map(item => 
                                typeof item === 'object' ? this.addTimestampsToNestedCreate(item, key, isCreate) : item
                            )
                        };
                    }
                    return; // Skip further processing for nested relations
                }
                
                // Handle other relation operations (connect, update, upsert)
                if (value.connect !== undefined || value.update !== undefined || value.upsert !== undefined) {
                    return; // Skip processing these relation operations
                }
            }
            
            // Convert string/number IDs to BigInt for database
            if (key.endsWith('_id') && value && (typeof value === 'string' || typeof value === 'number')) {
                data[key] = BigInt(value);
            }
        });

        return data;
    }

    // Add timestamps to nested create objects
    addTimestampsToNestedCreate(nestedData, relationKey, isCreate) {
        const now = new Date();
        const result = { ...nestedData };
        
        // Infer model name from relation key (e.g., 'locations' -> 'locations')
        // Try to find the model in Prisma schema
        const modelName = this.getModelNameFromRelationKey(relationKey);
        
        if (modelName) {
            // Check if the nested model has timestamp fields
            const hasCreatedAt = this.hasTimestampFieldForModel(modelName, 'created_at');
            const hasUpdatedAt = this.hasTimestampFieldForModel(modelName, 'updated_at');
            
            // Set created_at on nested create if not already set
            if (isCreate && !result.hasOwnProperty('created_at') && hasCreatedAt) {
                result.created_at = now;
            }
            
            // Set updated_at on nested create if not already set
            if (!result.hasOwnProperty('updated_at') && hasUpdatedAt) {
                result.updated_at = now;
            }
        } else {
            // If we can't determine the model, try to set timestamps anyway
            // Prisma will ignore them if the fields don't exist
            if (isCreate && !result.hasOwnProperty('created_at')) {
                result.created_at = now;
            }
            if (!result.hasOwnProperty('updated_at')) {
                result.updated_at = now;
            }
        }
        
        return result;
    }

    // Get model name from relation key (e.g., 'locations' -> 'locations')
    getModelNameFromRelationKey(relationKey) {
        // Relation keys are typically plural (locations, devices, etc.)
        // Try to find matching model in Prisma schema
        try {
            const dmmf = Prisma.dmmf;
            // Try exact match first
            let model = dmmf.datamodel.models.find(m => 
                m.name.toLowerCase() === relationKey.toLowerCase()
            );
            
            if (model) return model.name;
            
            // Try singular form (locations -> location)
            const singular = relationKey.replace(/s$/, '');
            model = dmmf.datamodel.models.find(m => 
                m.name.toLowerCase() === singular.toLowerCase()
            );
            
            if (model) return model.name;
            
            // Try to match by checking if any model name contains the key
            model = dmmf.datamodel.models.find(m => 
                m.name.toLowerCase().includes(relationKey.toLowerCase()) ||
                relationKey.toLowerCase().includes(m.name.toLowerCase())
            );
            
            return model ? model.name : null;
        } catch (error) {
            return null;
        }
    }

    // Get valid fields for the current model from Prisma DMMF
    getValidFieldsForModel() {
        try {
            const delegate = this.constructor.prismaModel;
            const dmmf = Prisma.dmmf;
            
            // Find the model in DMMF
            let modelName = null;
            for (const model of dmmf.datamodel.models) {
                try {
                    if (prisma[model.name] === delegate) {
                        modelName = model.name;
                        break;
                    }
                } catch (e) {
                    // Continue searching
                }
            }
            
            if (!modelName) {
                // Try to extract from delegate constructor name
                const delegateName = delegate.constructor?.name || '';
                for (const model of dmmf.datamodel.models) {
                    const modelNameLower = model.name.toLowerCase();
                    if (delegateName.toLowerCase().includes(modelNameLower) ||
                        delegateName.toLowerCase().replace(/delegate$/i, '') === modelNameLower) {
                        modelName = model.name;
                        break;
                    }
                }
            }
            
            if (!modelName) return [];
            
            const model = dmmf.datamodel.models.find(m => m.name === modelName);
            if (!model) return [];
            
            // Return all field names (both scalar and relation fields)
            return model.fields.map(f => f.name);
        } catch (error) {
            return [];
        }
    }

    // Check if a specific model has a timestamp field
    hasTimestampFieldForModel(modelName, fieldName) {
        try {
            const cacheKey = `${modelName}_${fieldName}`;
            
            // Check cache first
            if (BaseModel._timestampFieldCache.has(cacheKey)) {
                return BaseModel._timestampFieldCache.get(cacheKey);
            }
            
            const dmmf = Prisma.dmmf;
            const model = dmmf.datamodel.models.find(m => m.name === modelName);
            
            if (!model) {
                const result = true; // Assume it might exist
                BaseModel._timestampFieldCache.set(cacheKey, result);
                return result;
            }
            
            const hasField = model.fields.some(field => field.name === fieldName);
            BaseModel._timestampFieldCache.set(cacheKey, hasField);
            return hasField;
        } catch (error) {
            return true; // Assume it might exist
        }
    }

    // Check if the model has a timestamp field by checking Prisma DMMF
    // Uses a cache to avoid repeated lookups
    static _timestampFieldCache = new Map();
    
    hasTimestampField(fieldName) {
        try {
            const delegate = this.constructor.prismaModel;
            
            // Get the model name by finding which prisma property matches this delegate
            let modelName = null;
            const dmmf = Prisma.dmmf;
            
            // Try to match the delegate to a model by checking prisma client properties
            for (const model of dmmf.datamodel.models) {
                try {
                    // Check if this delegate is the same as prisma[modelName]
                    if (prisma[model.name] === delegate) {
                        modelName = model.name;
                        break;
                    }
                } catch (e) {
                    // Continue searching
                }
            }
            
            // If we couldn't find it by direct comparison, try alternative methods
            if (!modelName) {
                // Try to extract from delegate constructor name or other properties
                const delegateName = delegate.constructor?.name || '';
                for (const model of dmmf.datamodel.models) {
                    const modelNameLower = model.name.toLowerCase();
                    // Check if delegate name contains model name (e.g., "AccountsDelegate" -> "accounts")
                    if (delegateName.toLowerCase().includes(modelNameLower) ||
                        delegateName.toLowerCase().replace(/delegate$/i, '') === modelNameLower) {
                        modelName = model.name;
                        break;
                    }
                }
            }
            
            // Use the model-specific method if we found the model name
            if (modelName) {
                return this.hasTimestampFieldForModel(modelName, fieldName);
            }
            
            // If we can't determine the model, don't set timestamps (safer)
            // This prevents errors for models that don't have timestamp fields
            // Cache the result to avoid repeated lookups
            const cacheKey = `${delegate.constructor.name}_${fieldName}`;
            BaseModel._timestampFieldCache.set(cacheKey, false);
            return false;
        } catch (error) {
            // On error, don't set timestamps (safer)
            return false;
        }
    }

    serializeForJson() {
        return convertBigIntsToStrings(this.data);
    }

    // Static methods
    static async find(id, options = {}) {
        const defaultIncludes = this.getDefaultIncludes ? this.getDefaultIncludes() : undefined;
        const include = options.include || defaultIncludes;
        
        // Handle both String IDs (cuid) and BigInt IDs
        const whereId = typeof id === 'string' && /^\d+$/.test(id) ? BigInt(id) : id;
        
        const record = await this.prismaModel.findUnique({
            where: { id: whereId },
            include
        });
        
        if (!record) return null;
        
        return new this(convertBigIntsToStrings(record));
    }

    static async findMany(options = {}) {
        const {
            search,
            page = 1,
            per_page = 20,
            sort_by,
            sort_direction = 'asc',
            include,
            ...prismaOptions
        } = options;
    
        const searchableFields = this.getSearchableFields();
        const toManyRelations = this.getToManyRelations();
        let where = prismaOptions.where || {};
    
        if (search && searchableFields.length > 0) {
            const orConditions = searchableFields.map((field) => {
                if (field.includes('.')) {
                    const parts = field.split('.');
                    const relation = parts[0];
                    const relationPath = parts.slice(1);

                    // Build nested query based on relation type
                    const buildNestedQuery = (path, isToMany) => {
                        if (path.length === 1) {
                            // Last field in the path
                            const condition = {
                                [path[0]]: {
                                    contains: search,
                                    mode: 'insensitive'
                                }
                            };
                            return isToMany ? { some: condition } : condition;
                        } else {
                            // More nesting needed
                            const nextRelation = path[0];
                            const nextIsToMany = toManyRelations.includes(nextRelation);
                            const nestedQuery = buildNestedQuery(path.slice(1), nextIsToMany);
                            return isToMany 
                                ? { some: { [nextRelation]: nestedQuery } }
                                : { [nextRelation]: nestedQuery };
                        }
                    };

                    const isToMany = toManyRelations.includes(relation);
                    return {
                        [relation]: buildNestedQuery(relationPath, isToMany)
                    };
                }

                // scalar field
                return {
                    [field]: {
                        contains: search,
                        mode: 'insensitive'
                    }
                };
            });

            const searchConditions = { OR: orConditions };

            if (Object.keys(where).length > 0) {
                where = { AND: [where, searchConditions] };
            } else {
                where = searchConditions;
            }
        }
    
        const take = per_page;
        const skip = (page - 1) * per_page;
    
        const totalRecords = await this.prismaModel.count({ where });
        const totalPages = Math.ceil(totalRecords / take);
    
        let orderBy;
        if (sort_by) {
            if (sort_by.includes('.')) {
                const [relation, field] = sort_by.split('.');
                orderBy = { [relation]: { [field]: sort_direction } };
            } else {
                orderBy = { [sort_by]: sort_direction };
            }
        } else {
            orderBy = { id: 'desc' };
        }
    
        const records = await this.prismaModel.findMany({
            ...prismaOptions,
            where,
            orderBy,
            take,
            skip,
            include: include || prismaOptions.include
        });
    
        const instances = records.map((record) => new this(convertBigIntsToStrings(record)));
    
        return {
            records: instances,
            pagination: {
                page,
                per_page: take,
                total_pages: totalPages,
                total_records: totalRecords
            }
        };
    }

    static getSearchableFields() {
        // Override in subclasses.
        // Return array of field names, e.g. ['name','number','email']
        return [];
    }

    static getToManyRelations() {
        // Override in subclasses to specify which relations are to-many (arrays)
        // Return array of relation names that are arrays, e.g. ['locations', 'devices']
        // Relations not in this list are treated as singular (one-to-one or many-to-one)
        return [];
    }

    static getDefaultIncludes() {
        return {
            workspaces: true,
            leases: true,
            support_tickets: true,
            locations: true,
            devices: true,
            branch: true
        };
    }

    static async create(data) {
        const instance = new this(data);
        return await instance.create();
    }
}
