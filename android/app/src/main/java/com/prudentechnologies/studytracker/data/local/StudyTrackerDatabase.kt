package com.prudentechnologies.studytracker.data.local

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class StudyTrackerDatabase(context: Context) : SQLiteOpenHelper(
    context,
    "study_tracker.db",
    null,
    1
) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE app_state (id INTEGER PRIMARY KEY, json TEXT NOT NULL, updated_at INTEGER NOT NULL)"
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Future schema migrations belong here.
    }

    fun readState(): String? =
        readableDatabase.rawQuery(
            "SELECT json FROM app_state WHERE id = 1",
            null
        ).use { c -> if (c.moveToFirst()) c.getString(0) else null }

    fun writeState(json: String) {
        writableDatabase.execSQL(
            "INSERT OR REPLACE INTO app_state(id,json,updated_at) VALUES(1,?,?)",
            arrayOf(json, System.currentTimeMillis())
        )
    }
}
