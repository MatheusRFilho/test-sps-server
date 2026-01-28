export class Permission {
  constructor(
    public id: number,
    public code: string,
    public name: string,
    public description: string | null
  ) {}

  static fromDatabase(row: any): Permission {
    return new Permission(
      row.id,
      row.code,
      row.name,
      row.description || null
    );
  }
}

export class Role {
  constructor(
    public id: number,
    public code: string,
    public name: string,
    public description: string | null
  ) {}

  static fromDatabase(row: any): Role {
    return new Role(
      row.id,
      row.code,
      row.name,
      row.description || null
    );
  }
}
