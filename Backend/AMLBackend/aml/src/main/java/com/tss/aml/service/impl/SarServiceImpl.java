package com.tss.aml.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.entity.Sar;
import com.tss.aml.repository.SarRepository;
import com.tss.aml.service.SarService;

@Service
@Transactional
public class SarServiceImpl implements SarService {

    @Autowired
    private SarRepository sarRepository;

    @Override
    public List<Sar> getAllSars() {
        return sarRepository.findAllByOrderByCreatedAtDesc();
    }
}
