import { DeleteResult, Query, Schema } from 'mongoose';

export interface SoftDeleteFields {
  isDeleted: boolean;
  deletedAt: Date | null;
}

export interface SoftDeleteMethods {
  softDelete(): Promise<this>;
  restore(): Promise<this>;
  forceDelete(): Promise<DeleteResult>;
}

export function softDeletePlugin(schema: Schema): void {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  });

  schema.pre(/^find/, function (this: Query<unknown, unknown>) {
    const query = this.getQuery() as Record<string, unknown>;

    if (query.isDeleted !== undefined) return;

    this.where({
      isDeleted: false,
    });
  });

  schema.pre('countDocuments', function (this: Query<unknown, unknown>) {
    const query = this.getQuery() as Record<string, unknown>;

    if (query.isDeleted !== undefined) return;

    this.where({
      isDeleted: false,
    });
  });

  schema.methods.softDelete = async function () {
    if (this.isDeleted) return this;

    this.isDeleted = true;
    this.deletedAt = new Date();

    await this.save();

    return this;
  };

  schema.methods.restore = async function () {
    if (!this.isDeleted) return this;

    this.isDeleted = false;
    this.deletedAt = null;

    await this.save();

    return this;
  };

  schema.methods.forceDelete = async function () {
    return this.deleteOne();
  };
}
